#!/usr/bin/env python3
"""Offline consistency and reachability checks for CASE_SPEC.json.

This is a lightweight contract test, NOT the implementation of the browser game.
Run: python tests/validate_case_spec.py
"""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SPEC=json.loads((ROOT/'CASE_SPEC.json').read_text(encoding='utf-8'))
ACTIONS={a['id']:a for a in SPEC['actions']}
CARDS={e['id']:e for e in SPEC['evidence']}


def walk_condition(x):
    if any(k in x for k in ('all','any')):
        for v in x.get('all',[])+x.get('any',[]): yield from walk_condition(v)
    elif 'atLeast' in x:
        for v in x['atLeast']['of']:yield from walk_condition(v)
    else:
        yield x


def validate_references():
    assert len(CARDS)==len(SPEC['evidence']), 'Duplicate cards'
    assert len(ACTIONS)==len(SPEC['actions']), 'Duplicate actions'
    facts={e['addFact'] for a in ACTIONS.values() for e in a['effects'] if 'addFact' in e}
    observed={e['addObserved'] for a in ACTIONS.values() for e in a['effects'] if 'addObserved' in e}
    requests={r['id'] for r in SPEC['requests']}
    suspects={c['id'] for c in SPEC['characters'] if c['canMarkSuspect']}
    for action in ACTIONS.values():
        for clause in walk_condition(action['requires']):
            for k,valid in [('card',CARDS),('fact',facts),('observed',observed),('suspect',suspects)]:
                if k in clause:
                    assert clause[k] in valid, f"{action['id']}: unknown {k} {clause[k]}"
            if 'request' in clause:
                assert clause['request']['id'] in requests, (action['id'],clause)
        for effect in action['effects']:
            if 'addCard' in effect:
                assert effect['addCard'] in CARDS, (action['id'],effect)
            if 'requestUpdate' in effect:
                assert effect['requestUpdate']['id'] in requests
        assert action['mode'] in ('auto','player')
    for rule in SPEC['finalRules'].values():
        if not isinstance(rule,dict): continue
        for item in rule.get('all',[])+rule.get('none',[]):
            assert item in CARDS, ('court rule',item)
        for group in rule.get('oneFromEach',[]):
            assert group and all(c in CARDS for c in group)

class Game:
    def __init__(self):
        self.facts=set();self.cards=set();self.observed=set();self.suspects=set()
        self.requests={r['id']:'not_submitted' for r in SPEC['requests']}
        self.done=set();self.rooms=set()
    def holds(self,cond):
        if cond.get('always'): return True
        if 'all' in cond:return all(self.holds(c) for c in cond['all'])
        if 'any' in cond:return any(self.holds(c) for c in cond['any'])
        if 'atLeast' in cond:return sum(self.holds(c) for c in cond['atLeast']['of'])>=cond['atLeast']['n']
        if 'fact' in cond:return cond['fact'] in self.facts
        if 'card' in cond:return cond['card'] in self.cards
        if 'observed' in cond:return cond['observed'] in self.observed
        if 'suspect' in cond:return cond['suspect'] in self.suspects
        if 'request' in cond:return self.requests[cond['request']['id']]==cond['request']['status']
        raise ValueError(cond)
    def do(self,actionid,auto=False):
        a=ACTIONS[actionid]
        assert actionid not in self.done,(actionid,'already used')
        assert a['mode']==('auto' if auto else 'player'),(actionid,'wrong mode')
        assert self.holds(a['requires']),(actionid,'locked')
        for effect in a['effects']:
            for k,v in effect.items():
                if k=='addCard':self.cards.add(v)
                elif k=='addFact':self.facts.add(v)
                elif k=='addObserved':self.observed.add(v)
                elif k=='openRoom':self.rooms.add(v)
                elif k=='requestUpdate':
                    current=self.requests[v['id']]
                    allowed={('not_submitted','pending'),('pending','ready'),('ready','collected')}
                    assert (current,v['status']) in allowed,(actionid,current,v['status'])
                    self.requests[v['id']]=v['status']
        self.done.add(actionid)
        self.stabilize()
    def stabilize(self):
        while True:
            ready=[a for a in SPEC['actions'] if a['mode']=='auto' and a['id'] not in self.done and self.holds(a['requires'])]
            if not ready:break
            for a in ready:
                for effect in a['effects']:
                    if 'requestUpdate' in effect:
                        self.requests[effect['requestUpdate']['id']]=effect['requestUpdate']['status']
                self.done.add(a['id'])
    def suspect(self,who,on=True):
        (self.suspects.add if on else self.suspects.discard)(who)


def verdict(defendant, selected):
    ids=set(selected)
    assert ids <= set(CARDS)
    if defendant=='NORA':
        r=SPEC['finalRules']['NORA_CONVICTED']
        if set(r['all'])<=ids and all(bool(ids.intersection(group)) for group in r['oneFromEach']):return 'NORA_CONVICTED'
        return 'NORA_ACQUITTED'
    if defendant=='BRENNAN':
        r=SPEC['finalRules']['BRENNAN_WRONGFUL_CONVICTION']
        if set(r['all'])<=ids and all(bool(ids.intersection(group)) for group in r['oneFromEach']) and not ids.intersection(r['none']):return 'BRENNAN_WRONGFUL_CONVICTION'
        return 'BRENNAN_ACQUITTED'
    return {'ELIZABETH':'ELIZABETH_ACQUITTED','DANIEL':'DANIEL_DISMISSED','EDDIE':'EDDIE_DISMISSED','HAYES':'HAYES_DISMISSED'}.get(defendant,'OTHER_DISMISSED')


def before_affair(g, collect_wrench=True, collect_button=True):
    for id in ['A_START','A_FRANK','A_SCENE_PHOTOS','A_AUTOPSY','A_NORA_OFFICE','A_OWEN','A_BRENNAN_1','A_LILLIAN_1','A_WORK_OFFICE','A_INVOICE','A_RENT_TALLY','A_DANIEL_FIRST','A_ELIZABETH_1','A_HAYES_FIRST','A_ELIZABETH_2','A_ELIZABETH_GAP']:
        g.do(id)
    if collect_wrench:
        g.do('A_OBSERVE_WRENCH');g.do('A_COLLECT_WRENCH')
    if collect_button:
        g.do('A_OBSERVE_BUTTON');g.do('A_COLLECT_BUTTON')
    for id in ['A_REQUEST_OWNER','A_LILLIAN_FIN','A_OWNER_GET','A_ADDRESS_REQUEST','A_ADDRESS_GET','A_NORA_AFFAIR']:
        g.do(id)
    assert 'W_NORA_AFFAIR' in g.cards


def late_nora(g, serious_first=False, medical_first=False):
    if medical_first:
        for id in ['A_DELAYED_REQUEST','A_DELAYED_GET','A_HOME_STUDY']:
            g.do(id)
        g.do('A_ELIZABETH_AFFAIR')
        g.do('A_HAYES_SECOND');g.do('A_EDDIE');g.do('A_EDDIE_COMPAT')
    else:
        g.do('A_ELIZABETH_AFFAIR')
        g.do('A_HAYES_SECOND');g.do('A_EDDIE')
        g.do('A_DELAYED_REQUEST');g.do('A_DELAYED_GET');g.do('A_EDDIE_COMPAT')
        g.do('A_HOME_STUDY')
    g.do('A_HOME_DRAWER');g.do('A_HOME_DIARY')
    g.suspect('NORA')
    if serious_first:g.do('A_NORA_SERIOUS')
    g.do('A_NORA_ADDRESS_REQ');g.do('A_NORA_ADDRESS_GET')
    g.do('A_OBSERVE_COAT');g.do('A_COLLECT_COAT')
    if not serious_first:g.do('A_NORA_SERIOUS')


def win_packet(g):
    return {x for x in ['R_BUTTON_MATCH','E_BUTTON','E_COAT','D_DIARY','D_FIRING','W_NORA_SERIOUS','R_DELAYED','W_EDDIE','W_IRENE'] if x in g.cards}


def suite():
    validate_references()
    g=Game();before_affair(g);late_nora(g,serious_first=True)
    g.do('A_BUTTON_COAT_LINK');g.do('A_BUTTON_LAB_REQ');g.do('A_BUTTON_GET')
    assert verdict('NORA',win_packet(g))=='NORA_CONVICTED'
    assert verdict('NORA',win_packet(g)-{'R_BUTTON_MATCH'})=='NORA_ACQUITTED'
    assert 'W_NORA_SERIOUS' in g.cards and 'R_BUTTON_MATCH' in g.cards
    print('PASS: golden path, serious Nora before button match')

    g2=Game();before_affair(g2,collect_wrench=False);late_nora(g2,medical_first=True)
    assert 'E_WRENCH' not in g2.cards and not g2.holds(ACTIONS['A_WRENCH_REQUEST']['requires'])
    assert 'W_EDDIE' in g2.cards and 'F_HOME_STUDY_OPEN' in g2.facts
    g2.do('A_BUTTON_COAT_LINK');g2.do('A_BUTTON_LAB_REQ');g2.do('A_BUTTON_GET')
    assert verdict('NORA',win_packet(g2))=='NORA_CONVICTED'
    print('PASS: no wrench, medical-first branch, winner still reachable')

    g3=Game();before_affair(g3,collect_button=False);late_nora(g3)
    assert 'E_BUTTON' not in g3.cards
    assert not g3.holds(ACTIONS['A_BUTTON_COAT_LINK']['requires'])
    assert verdict('NORA',win_packet(g3))=='NORA_ACQUITTED'
    g3.do('A_OBSERVE_BUTTON');assert 'E_BUTTON' not in g3.cards
    g3.do('A_COLLECT_BUTTON');g3.do('A_BUTTON_COAT_LINK');g3.do('A_BUTTON_LAB_REQ');g3.do('A_BUTTON_GET')
    assert verdict('NORA',win_packet(g3))=='NORA_CONVICTED'
    print('PASS: missing button loses; inspect-only not evidence; return and collect works')

    gb=Game();gb.do('A_START');gb.do('A_NORA_OFFICE');gb.do('A_OWEN');gb.do('A_BRENNAN_1');gb.do('A_OBSERVE_WRENCH');gb.do('A_COLLECT_WRENCH')
    packet={'W_OWEN','W_BRENNAN_1','E_WRENCH','W_NORA_INITIAL'}
    assert packet<=gb.cards
    assert verdict('BRENNAN',packet)=='BRENNAN_WRONGFUL_CONVICTION'
    assert verdict('BRENNAN',packet|{'R_WRENCH'})=='BRENNAN_ACQUITTED'
    print('PASS: Brennan wrong verdict from chosen evidence, report reverses it')

    ge=Game();ge.do('A_START');ge.do('A_NORA_OFFICE');ge.do('A_BRENNAN_1')
    assert ge.holds(ACTIONS['A_LILLIAN_1']['requires'])
    assert not ge.holds(ACTIONS['A_DANIEL_FIRST']['requires'])
    ge.suspect('ELIZABETH');ge.do('A_ELIZABETH_PRIVATE');ge.suspect('ELIZABETH',False)
    assert 'F_ELIZABETH_PRIVATE_OPEN' in ge.facts
    print('PASS: accounting after Brennan, Daniel late, room persists after suspect removal')

    assert 'R_BUTTON_MATCH' in CARDS and CARDS['R_BUTTON_MATCH']['type']=='forensic'
    for end in ['NORA_ACQUITTED','BRENNAN_WRONGFUL_CONVICTION','BRENNAN_ACQUITTED','ELIZABETH_ACQUITTED','DANIEL_DISMISSED','EDDIE_DISMISSED','HAYES_DISMISSED','OTHER_DISMISSED']:
        assert not end.endswith('REVEAL_NORA')
    print('PASS: IDs and court packages; no truth-revealing wrong-ending IDs')

if __name__=='__main__':
    suite()

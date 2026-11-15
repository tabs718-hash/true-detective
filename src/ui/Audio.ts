export class Atmosphere {
 private context:AudioContext|null=null;private gain:GainNode|null=null;private effects:GainNode|null=null;
 start(volume:number){if(this.context){void this.context.resume();this.volume(volume);return}const ctx=new AudioContext();this.context=ctx;const gain=ctx.createGain();gain.gain.value=volume*.05;gain.connect(ctx.destination);this.gain=gain;this.effects=ctx.createGain();this.effects.gain.value=.04;this.effects.connect(ctx.destination);
  // Original sustained minor ninth ambience, generated locally; no recordings.
  [65.406,130.813,155.563,195.998,246.942,293.665].forEach((hz,i)=>{const osc=ctx.createOscillator();const voice=ctx.createGain();osc.type=i<2?'sine':'triangle';osc.frequency.value=hz;osc.detune.value=(i%2?1:-1)*2;voice.gain.value=i<2?.35:.045;osc.connect(voice);voice.connect(gain);osc.start()});
 }
 volume(v:number){if(this.context&&this.gain)this.gain.gain.setTargetAtTime(v*.05,this.context.currentTime,.15)}
 effect(volume:number){if(!this.context||!this.effects)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(430,c.currentTime);o.frequency.exponentialRampToValueAtTime(160,c.currentTime+.09);g.gain.setValueAtTime(volume*.05,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.12);o.connect(g);g.connect(this.effects);o.start();o.stop(c.currentTime+.13)}
 async stop(){await this.context?.suspend()}
}

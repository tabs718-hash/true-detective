import { Component, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export class FeatureBoundary extends Component<{ children: ReactNode; onReturn: () => void; returnLabel?: string; message?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="feature-unavailable">
      <h2>Раздел временно недоступен</h2>
      <p>{this.props.message ?? 'Расследование остаётся открытым. Сохраните текущую игру перед обновлением страницы.'}</p>
      <button className="secondary" onClick={() => { this.setState({ failed: false }); this.props.onReturn(); }}><ArrowLeft size={16}/>{this.props.returnLabel ?? 'Вернуться на место'}</button>
    </div>;
  }
}

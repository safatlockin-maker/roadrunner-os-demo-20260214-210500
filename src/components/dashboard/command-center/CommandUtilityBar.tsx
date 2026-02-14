import { format } from 'date-fns';
import { Clock3, ExternalLink, Link2, RefreshCw } from 'lucide-react';

interface CommandUtilityBarProps {
  connected: boolean;
  dealCount: number;
  dataAsOf: Date;
  onOpenInventory: () => void;
  onRefresh: () => void;
}

export default function CommandUtilityBar({
  connected,
  dealCount,
  dataAsOf,
  onOpenInventory,
  onRefresh,
}: CommandUtilityBarProps) {
  return (
    <div className="cc-topbar">
      <div className="flex flex-wrap items-center gap-3">
        <div className="cc-pill">
          <Link2 size={14} />
          <span>{connected ? 'Connected' : 'Offline'}</span>
          <span className="text-[#7D8FB8]">•</span>
          <span className="text-[#B8C4E0]">{dealCount} active deals</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="cc-pill">
          <Clock3 size={14} />
          <span>Data as of {format(dataAsOf, 'MMM d, yyyy, h:mm a')}</span>
        </div>

        <button type="button" onClick={onOpenInventory} className="cc-pill-button">
          <ExternalLink size={14} />
          <span>Open Inventory</span>
        </button>

        <button type="button" onClick={onRefresh} className="cc-pill-button">
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

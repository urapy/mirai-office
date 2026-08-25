import { FUND_ROOMS } from './fundRooms.js';
import { getFictionalProduct } from './productCatalog.js';
import type { RealtimePerformanceState } from './realtimeApi.js';

interface FundRoomSwitcherProps {
  activeProductId: string;
  ownedProductIds: readonly string[];
  onRoomChange: (productId: string) => void;
  performanceState?: RealtimePerformanceState;
}

export function FundRoomSwitcher({
  activeProductId,
  ownedProductIds,
  onRoomChange,
  performanceState,
}: FundRoomSwitcherProps) {
  const activeRoom = FUND_ROOMS.find((room) => room.productId === activeProductId)!;
  const activeProduct = getFictionalProduct(activeProductId);

  return (
    <nav className="mirai-room-nav" aria-label="ファンドの部屋を選ぶ">
      <div className="mirai-room-nav-heading">
        <div>
          <span>{activeProduct.name}</span>
          <strong>{activeRoom.name}</strong>
        </div>
        <small>{activeRoom.concept}</small>
      </div>
      <div className="mirai-room-tabs" role="tablist" aria-label="ファンドルーム">
        {FUND_ROOMS.map((room) => {
          const product = getFictionalProduct(room.productId);
          const isActive = room.productId === activeProductId;
          const isOwned = ownedProductIds.includes(room.productId);
          return (
            <button
              key={room.productId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`${product.name}の${room.name}を表示`}
              className={`mirai-room-tab mirai-room-tab--${room.productId} ${isActive ? 'is-active' : ''}`}
              onClick={() => onRoomChange(room.productId)}
            >
              <span className="mirai-room-tab-dot" />
              <span>{product.shortName}</span>
              <small>
                {room.name} ·{' '}
                {product.kind === 'company-watch' ? '自動調査' : isOwned ? '活動中' : '見学'}
              </small>
            </button>
          );
        })}
      </div>
      <div className="mirai-performance" aria-label="仕事コンディション">
        <div>
          <span>
            {activeProduct.kind === 'company-watch' ? '調査ステータス' : '仕事コンディション'}
          </span>
          <strong>
            {activeProduct.kind === 'company-watch'
              ? '公式情報を確認'
              : (performanceState?.label ?? '通常')}
          </strong>
        </div>
        <div className="mirai-performance-track">
          <span
            style={{
              width: `${activeProduct.kind === 'company-watch' ? 100 : (performanceState?.score ?? 55)}%`,
            }}
          />
        </div>
        <small>
          {activeProduct.kind === 'company-watch'
            ? 'NVIDIA Newsroomの最新発表を自動で調べます'
            : (performanceState?.headline ?? 'いつもの仕事を続けています')}
        </small>
      </div>
    </nav>
  );
}

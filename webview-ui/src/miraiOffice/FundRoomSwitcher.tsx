import { FUND_ROOMS } from './fundRooms.js';

interface FundRoomSwitcherProps {
  activeProductId: string;
  ownedProductIds: readonly string[];
  onRoomChange: (productId: string) => void;
}

export function FundRoomSwitcher({
  activeProductId,
  ownedProductIds,
  onRoomChange,
}: FundRoomSwitcherProps) {
  const activeRoom = FUND_ROOMS.find((room) => room.productId === activeProductId)!;

  return (
    <nav className="mirai-room-nav" aria-label="ファンドの部屋を選ぶ">
      <div className="mirai-room-nav-heading">
        <div>
          <span>FUND ROOMS</span>
          <strong>{activeRoom.name}</strong>
        </div>
        <small>{activeRoom.concept}</small>
      </div>
      <div className="mirai-room-tabs" role="tablist" aria-label="ファンドルーム">
        {FUND_ROOMS.map((room) => {
          const isActive = room.productId === activeProductId;
          const isOwned = ownedProductIds.includes(room.productId);
          return (
            <button
              key={room.productId}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`mirai-room-tab mirai-room-tab--${room.productId} ${isActive ? 'is-active' : ''}`}
              onClick={() => onRoomChange(room.productId)}
            >
              <span className="mirai-room-tab-dot" />
              <span>{room.shortName}</span>
              <small>{isOwned ? '活動中' : '見学'}</small>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

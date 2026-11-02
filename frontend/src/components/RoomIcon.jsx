import {
  Bath, ShowerHead, BedDouble, CookingPot, Sofa, Tv, Shirt, DoorOpen, Trash2, Leaf, Car, BookOpen,
  Home, Sparkles, Brush, Droplets, UtensilsCrossed, Armchair,
} from 'lucide-react';

// Scelte proposte quando si crea una stanza. Nel database `rooms.icon` resta
// l'emoji: qui viene solo disegnata come icona a tratto, così le stanze già
// esistenti funzionano senza migrazioni.
export const ROOM_ICON_CHOICES = ['🛁', '🚿', '🛏️', '🍳', '🛋️', '📺', '🧺', '🚪', '🗑️', '🌿', '🚗', '📚'];

const ICONS = {
  '🛁': Bath,
  '🚿': ShowerHead,
  '🛏': BedDouble,
  '🍳': CookingPot,
  '🛋': Sofa,
  '📺': Tv,
  '🧺': Shirt,
  '🚪': DoorOpen,
  '🗑': Trash2,
  '🌿': Leaf,
  '🚗': Car,
  '📚': BookOpen,
  '🏠': Home,
  '✨': Sparkles,
  '🧹': Brush,
  '💧': Droplets,
  '🍽': UtensilsCrossed,
  '🪑': Armchair,
};

// Un'emoji personalizzata senza corrispondenza resta mostrata com'è.
export function RoomIcon({ icon, size = 20, strokeWidth = 1.8, className = '' }) {
  const Icon = ICONS[(icon ?? '').replace(/️/g, '')];
  if (Icon) return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
  return (
    <span className={className} style={{ fontSize: size * 0.9, lineHeight: 1 }} aria-hidden="true">
      {icon || '✨'}
    </span>
  );
}

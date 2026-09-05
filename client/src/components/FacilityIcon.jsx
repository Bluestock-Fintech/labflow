import { Snowflake, Zap, Armchair, Car, Wifi, Droplet, Camera, Lock, Sparkles } from 'lucide-react';

const FACILITY_ICONS = {
  ac: Snowflake,
  inverter: Zap,
  'premium chair': Armchair,
  parking: Car,
  wifi: Wifi,
  'ro water': Droplet,
  cctv: Camera,
  locker: Lock,
};

export function facilityIcon(name) {
  return FACILITY_ICONS[(name || '').trim().toLowerCase()] ?? Sparkles;
}

export default function FacilityIcon({ name, className, strokeWidth = 1.75 }) {
  const Icon = facilityIcon(name);
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

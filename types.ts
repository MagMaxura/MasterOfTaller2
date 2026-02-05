
export enum Role {
  TECHNICIAN = 'tecnico',
  ADMIN = 'administrador',
}

export enum MissionStatus {
  REQUESTED = 'Solicitada',
  PENDING = 'Pendiente',
  IN_PROGRESS = 'En Progreso',
  COMPLETED = 'Completada',
}

export enum MissionDifficulty {
  LOW = 'Bajo',
  MEDIUM = 'Medio',
  HIGH = 'Alto',
}

export enum EquipmentSlot {
    HEAD = 'head',
    FACE = 'face',
    EARS = 'ears',
    OUTERWEAR = 'outerwear',
    SHIRT = 'shirt',
    HANDS = 'hands',
    BELT = 'belt',
    PANTS = 'pants',
    FEET = 'feet',
    ACCESSORY = 'accessory'
}

export enum PayrollEventType {
    OVERTIME = 'HORA_EXTRA',
    BONUS = 'BONO',
    ABSENCE = 'FALTA',
    TARDINESS = 'TARDANZA',
    PENALTY = 'APERCIBIMIENTO'
}

export enum PaymentStatus {
    CALCULATED = 'CALCULADO',
    PAID = 'PAGADO'
}

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    slot: EquipmentSlot;
    icon_url: string;
    quantity: number;
}

export interface UserInventoryItem {
    id: string; // This is the ID of the user_inventory row
    assigned_at: string;
    item: InventoryItem;
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 0-100
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Location {
  lat: number;
  lng: number;
  lastUpdate: string; // ISO 8601 timestamp
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  xp: number;
  level: number;
  skills: Skill[];
  badges: Badge[];
  inventory: UserInventoryItem[];
  location?: Location;
  pushSubscription?: any | null;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  difficulty: MissionDifficulty;
  xp: number;
  assignedTo: string[] | null; // User IDs
  startDate: string;
  deadline: string;
  skills: string[]; // Array of skill names
  progressPhoto?: string; // base64
  completedDate?: string;
  bonusXp?: number;
  bonusMonetario?: number;
  visibleTo: string[] | null; // User IDs
  created_at?: string;
}

export interface MissionMilestone {
  id: string;
  mission_id: string;
  user_id: string;
  description: string;
  image_url: string | null;
  created_at: string;
  is_solution: boolean;
  mission: {
    title: string;
    required_skills: string[];
  } | null;
}

export interface Chat {
  id: string;
  created_at: string;
  participant_1: string;
  participant_2: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Supply {
  id: string;
  created_at: string;
  general_category: string;
  specific_category: string;
  type: string;
  model: string;
  details: string | null;
  stock_quantity: number;
  photo_url: string | null;
}

export interface MissionSupply {
  id: string;
  mission_id: string;
  supply_id: string;
  quantity_assigned: number;
  quantity_used: number;
  supplies: Supply; // This will be populated after fetch
}

export interface Salary {
    id: string;
    user_id: string;
    monto_base_quincenal: number;
    created_at: string;
}

export interface PayrollEvent {
    id: string;
    user_id: string;
    tipo: PayrollEventType;
    descripcion: string;
    monto: number;
    fecha_evento: string;
    periodo_pago_id: string | null;
    mission_id: string | null;
    created_at: string;
}

export interface PaymentPeriod {
    id: string;
    user_id: string;
    fecha_inicio_periodo: string;
    fecha_fin_periodo: string;
    fecha_pago: string;
    salario_base_calculado: number;
    total_adiciones: number;
    total_deducciones: number;
    monto_final_a_pagar: number;
    estado: PaymentStatus;
    created_at: string;
    events: PayrollEvent[];
}

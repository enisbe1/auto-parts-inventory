// ─── Part Template types ──────────────────────────────────────────────────────
export interface PartTemplate {
  id: string;
  en: string;
  al: string;
  de: string;
  category: string;
}

// ─── Hardcoded defaults (used when localStorage is empty) ─────────────────────
export const DEFAULT_TEMPLATES: PartTemplate[] = [
  // Engine & Drivetrain
  { id: 'engine',      en: 'Engine',                   al: 'Motor',                        de: 'Motor',                       category: 'Engine & Drivetrain' },
  { id: 'gearbox',     en: 'Gearbox',                  al: 'Kuti Marsheve',                de: 'Getriebe',                    category: 'Engine & Drivetrain' },
  { id: 'turbo',       en: 'Turbocharger',              al: 'Turbokompresori',              de: 'Turbolader',                  category: 'Engine & Drivetrain' },
  { id: 'exhaust',     en: 'Exhaust System',            al: 'Sistemi i Shkarkimit',         de: 'Auspuffanlage',               category: 'Engine & Drivetrain' },
  { id: 'catalyst',    en: 'Catalytic Converter',       al: 'Katalizatori',                 de: 'Katalysator',                 category: 'Engine & Drivetrain' },
  { id: 'fueltank',    en: 'Fuel Tank',                 al: 'Depozita e Karburantit',       de: 'Kraftstofftank',              category: 'Engine & Drivetrain' },
  { id: 'propshaft',   en: 'Propshaft',                 al: 'Boshti i Transmetimit',        de: 'Kardanwelle',                 category: 'Engine & Drivetrain' },
  // Electrical
  { id: 'alternator',  en: 'Alternator',                al: 'Alternator',                   de: 'Lichtmaschine',               category: 'Electrical' },
  { id: 'starter',     en: 'Starter Motor',             al: 'Motor Starterit',              de: 'Anlasser',                    category: 'Electrical' },
  { id: 'battery',     en: 'Battery',                   al: 'Bateri',                       de: 'Batterie',                    category: 'Electrical' },
  { id: 'ecu',         en: 'ECU / Engine Control Unit', al: 'Njësia e Kontrollit',          de: 'Motorsteuergerät',            category: 'Electrical' },
  { id: 'abs',         en: 'ABS Pump',                  al: 'Pompa ABS',                    de: 'ABS-Pumpe',                   category: 'Electrical' },
  { id: 'cluster',     en: 'Instrument Cluster',        al: 'Paneli i Shpejtësisë',         de: 'Kombiinstrument',             category: 'Electrical' },
  // Cooling
  { id: 'radiator',    en: 'Radiator',                  al: 'Radiator',                     de: 'Kühler',                      category: 'Cooling' },
  { id: 'accomp',      en: 'A/C Compressor',            al: 'Kompresori i Klimës',          de: 'Klimakompressor',             category: 'Cooling' },
  { id: 'intercooler', en: 'Intercooler',               al: 'Interkooler',                  de: 'Ladeluftkühler',              category: 'Cooling' },
  // Body
  { id: 'hood',        en: 'Hood / Bonnet',             al: 'Kapaku i Motorit',             de: 'Motorhaube',                  category: 'Body' },
  { id: 'tailgate',    en: 'Tailgate / Boot Lid',       al: 'Porta e Pasme',                de: 'Heckklappe',                  category: 'Body' },
  { id: 'bumper_f',    en: 'Front Bumper',              al: 'Bamper i Përparmë',            de: 'Frontstoßstange',             category: 'Body' },
  { id: 'bumper_r',    en: 'Rear Bumper',               al: 'Bamper i Pasëm',               de: 'Heckstoßstange',              category: 'Body' },
  { id: 'door_fl',     en: 'Front Left Door',           al: 'Dera e Majtë Përpara',         de: 'Vordere linke Tür',           category: 'Body' },
  { id: 'door_fr',     en: 'Front Right Door',          al: 'Dera e Djathtë Përpara',       de: 'Vordere rechte Tür',          category: 'Body' },
  { id: 'door_rl',     en: 'Rear Left Door',            al: 'Dera e Majtë Prapa',           de: 'Hintere linke Tür',           category: 'Body' },
  { id: 'door_rr',     en: 'Rear Right Door',           al: 'Dera e Djathtë Prapa',         de: 'Hintere rechte Tür',          category: 'Body' },
  { id: 'wing_fl',     en: 'Front Left Wing',           al: 'Kallapi i Majtë Përpara',      de: 'Vorderer linker Kotflügel',   category: 'Body' },
  { id: 'wing_fr',     en: 'Front Right Wing',          al: 'Kallapi i Djathtë Përpara',    de: 'Vorderer rechter Kotflügel',  category: 'Body' },
  { id: 'mirror_l',    en: 'Left Side Mirror',          al: 'Pasqyra e Majtë',              de: 'Linker Außenspiegel',         category: 'Body' },
  { id: 'mirror_r',    en: 'Right Side Mirror',         al: 'Pasqyra e Djathtë',            de: 'Rechter Außenspiegel',        category: 'Body' },
  // Lighting
  { id: 'light_fl',    en: 'Front Left Headlight',      al: 'Fari i Majtë Përpara',         de: 'Linker Scheinwerfer',         category: 'Lighting' },
  { id: 'light_fr',    en: 'Front Right Headlight',     al: 'Fari i Djathtë Përpara',       de: 'Rechter Scheinwerfer',        category: 'Lighting' },
  { id: 'light_rl',    en: 'Rear Left Taillight',       al: 'Llamba e Majtë Prapa',         de: 'Linkes Rücklicht',            category: 'Lighting' },
  { id: 'light_rr',    en: 'Rear Right Taillight',      al: 'Llamba e Djathtë Prapa',       de: 'Rechtes Rücklicht',           category: 'Lighting' },
  // Suspension & Brakes
  { id: 'strut_fl',    en: 'Front Left Strut',          al: 'Amortizator i Majtë Përpara',  de: 'Vorderes linkes Federbein',   category: 'Suspension & Brakes' },
  { id: 'strut_fr',    en: 'Front Right Strut',         al: 'Amortizator i Djathtë Përpara',de: 'Vorderes rechtes Federbein',  category: 'Suspension & Brakes' },
  { id: 'strut_rl',    en: 'Rear Left Strut',           al: 'Amortizator i Majtë Prapa',    de: 'Hinteres linkes Federbein',   category: 'Suspension & Brakes' },
  { id: 'strut_rr',    en: 'Rear Right Strut',          al: 'Amortizator i Djathtë Prapa',  de: 'Hinteres rechtes Federbein',  category: 'Suspension & Brakes' },
  { id: 'disc_fl',     en: 'Front Left Brake Disc',     al: 'Disk Freni i Majtë Përpara',   de: 'Vordere linke Bremsscheibe',  category: 'Suspension & Brakes' },
  { id: 'disc_fr',     en: 'Front Right Brake Disc',    al: 'Disk Freni i Djathtë Përpara', de: 'Vordere rechte Bremsscheibe', category: 'Suspension & Brakes' },
  { id: 'steering',    en: 'Power Steering Pump',       al: 'Pompa e Drejtimit',            de: 'Servolenkungspumpe',          category: 'Suspension & Brakes' },
  // Interior
  { id: 'dashboard',   en: 'Dashboard',                 al: 'Paneli i Instrumenteve',       de: 'Armaturenbrett',              category: 'Interior' },
  { id: 'wheel',       en: 'Steering Wheel',            al: 'Timon',                        de: 'Lenkrad',                     category: 'Interior' },
  { id: 'seat_fl',     en: 'Front Left Seat',           al: 'Sedilia e Majtë Përpara',      de: 'Vorderer linker Sitz',        category: 'Interior' },
  { id: 'seat_fr',     en: 'Front Right Seat',          al: 'Sedilia e Djathtë Përpara',    de: 'Vorderer rechter Sitz',       category: 'Interior' },
  { id: 'seat_r',      en: 'Rear Seat',                 al: 'Sediljet e Pasme',             de: 'Rücksitzbank',                category: 'Interior' },
  { id: 'sunroof',     en: 'Sunroof Panel',             al: 'Çatia e Hapur',                de: 'Schiebedach',                 category: 'Interior' },
];

const STORAGE_KEY = 'autoparts_part_templates';

/** Load templates from localStorage, falling back to hardcoded defaults. */
export function loadTemplates(): PartTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_TEMPLATES];
    const parsed = JSON.parse(raw) as PartTemplate[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_TEMPLATES];
  } catch {
    return [...DEFAULT_TEMPLATES];
  }
}

/** Save templates to localStorage. */
export function saveTemplates(templates: PartTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

/** Get sorted unique category names from a template list. */
export function getCategories(templates: PartTemplate[]): string[] {
  return [...new Set(templates.map(p => p.category))];
}

/** Generate a simple unique id for new templates. */
export function newTemplateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

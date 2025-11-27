export interface Service {
  id: string;
  number: string;
  title: string;
  description?: string;
}

export interface Doctor {
  id: string;
  name: string;
  role: string;
  image: string;
  active?: boolean;
}

export interface NavLink {
  label: string;
  href: string;
}
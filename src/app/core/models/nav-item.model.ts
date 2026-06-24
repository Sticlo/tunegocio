export interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
}

export interface CategoryPageData {
  slug: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  image: string;
}

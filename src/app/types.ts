export interface File {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
  files: File[];
  collections: Collection[];
  isOpen?: boolean;
}

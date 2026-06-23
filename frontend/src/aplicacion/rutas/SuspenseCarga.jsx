import { Suspense } from 'react';
import { Cargando } from '../../compartido/componentes';

export function SuspenseCarga({ children }) {
  return <Suspense fallback={<Cargando />}>{children}</Suspense>;
}

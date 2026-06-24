import { Component } from 'react';
import MensajeError from '../mensaje_error/MensajeError';
import '../../../estilos/compartido/limite_error/limite_error.css';

export default class LimiteError extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[LimiteError]', error, info.componentStack);
    }
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div className="limite-error">
          <MensajeError
            titulo="Algo salio mal"
            mensaje="Ocurrio un error inesperado. Puedes recargar la pagina o volver al inicio."
            onReintentar={() => window.location.reload()}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

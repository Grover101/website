import React, { useRef, useState, useEffect } from 'react'
import ModalEdicion from '../../components/modal/edicionCurso'
import ModalConfirmacion from '../../components/modal/confirmacion'
import { obtRegistrosPaginadosAdmin, actEstadoCursoAdmin } from '../../api'
import $ from 'jquery';

const regMaximo = 3;
const coleccion = 'cursos';
const campo = 'titulo';

const Cursos = () => {

    const [pagina, estPagina] = useState(1);
    const [cursos, estCursos] = useState([]);
    const [cargando, estCargando] = useState(false);
    const [registro, estRegistro] = useState(null); // Establece el registro seleecionado para hacer ediciones o eliminaciones
    const [modo, estModo] = useState(null); // Establece si se está editando o creando un registro
    const [haySiguiente, estHaySiguiente] = useState(false); // Para la paginación

    // Refs
    const refModalEdicion = useRef(null);
    const refModalConfirmacion = useRef(null);

    useEffect(() => {
        estCargando(true);
        obtenerCursos();
    }, []);

    const obtenerCursos = (reinicio) => {
        // El parámetro reinicio se usa después de editar o crear un registro, para que empiece
        // a mostrar todo desde la primera página
        obtRegistrosPaginadosAdmin(coleccion, campo, regMaximo, null, reinicio ? null : cursos[0], true) // Este parámetro true es para que no se cambien las posiciones cuando haga un cambio de estado
            .then(({ lista, haySiguiente }) => {
                if (reinicio) {
                    estPagina(1);
                }
                estHaySiguiente(haySiguiente);
                estCursos(lista);
                estCargando(false);
            })
    }

    const editarModal = (registro) => {
        estRegistro(registro);
        estModo('EDICION');
        $(refModalEdicion.current).modal('show');
    }

    const crearModal = (e) => {
        e.preventDefault();
        estRegistro(undefined);
        estModo('CREACION');
        $(refModalEdicion.current).modal('show');
    }

    const confirmarModal = (registro) => {
        estRegistro(registro);
        $(refModalConfirmacion.current).modal('show');
    }

    const cerrarModalConfirmacion = () => {
        $(refModalConfirmacion.current).modal('hide');
    }

    const guardarCambiosEdicion = () => {
        cerrarModalEdicion();
        obtenerCursos(true);
    }

    const cerrarModalEdicion = () => {
        $(refModalEdicion.current).modal('hide');
    }

    const actualizarEstado = () => {
        cerrarModalConfirmacion();
        const nuevoEstado = registro.activo ? 0 : 1;
        actEstadoCursoAdmin(registro.id, nuevoEstado).then(() => {
            obtenerCursos();
        });
    }

    const retroceder = () => {
        obtRegistrosPaginadosAdmin(coleccion, campo, regMaximo, cursos[0])
            .then(({ lista }) => {
                estHaySiguiente(true); // Si retrocedo, es porque siempre hay un siguiente
                estCursos(lista);
                estPagina(pagina - 1);
            })
    }

    const avanzar = () => {
        obtRegistrosPaginadosAdmin(coleccion, campo, regMaximo, null, cursos[cursos.length - 1])
            .then(({ lista, haySiguiente }) => {
                estHaySiguiente(haySiguiente);
                estCursos(lista);
                estPagina(pagina + 1);
            })
    }

    return (
        <div>
            <ModalConfirmacion
                ref={refModalConfirmacion}
                texto={`¿Quieres ${registro?.activo ? ' desactivar' : ' activar'} este curso?`}
                confirmar={actualizarEstado}
                cancelar={cerrarModalConfirmacion} />

            <ModalEdicion
                modo={modo}
                data={registro}
                ref={refModalEdicion}
                guardarCambios={guardarCambiosEdicion}
                cancelar={cerrarModalEdicion} />

            <div className="table-responsive-md">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Título</th>
                            <th scope="col">Días</th>
                            <th scope="col">Horas</th>
                            <th scope="col">Activo</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            cursos.map((curso, indice) => (
                                <tr key={curso.id} className={curso.activo ? '' : 'table-danger'}>
                                    <th scope="row">{indice + 1}</th>
                                    <td>{curso.titulo}</td>
                                    <td>{curso.dias.join(', ')}</td>
                                    <td>{curso.hInicioFin.join(' a ')}</td>
                                    <td>{curso.activo ? 'Sí' : 'No'}</td>
                                    <td>
                                        <button onClick={() => editarModal(curso)} className='btn btn-secondary'>
                                            <i className='fa fa-edit'></i>
                                        </button>
                                        <button onClick={() => { }} className='btn btn-primary ml-3'>
                                            <i className='fas fa-video'></i>
                                        </button>
                                        {
                                            curso.activo
                                                ?
                                                <button onClick={() => confirmarModal(curso)} className='btn btn-danger ml-3'>
                                                    <i className='fa fa-power-off'></i>
                                                </button>
                                                :
                                                <button onClick={() => confirmarModal(curso)} className='btn btn-success ml-3'>
                                                    <i className='fa fa-power-off'></i>
                                                </button>
                                        }
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
            <a onClick={crearModal} className="boton btn-principal d-block mt-4">
                {'Agregar '}<i className="fas fa-plus" style={{ fontSize: '12px' }}></i>
            </a>
            <ul className="pagination pagination-lg justify-content-center mt-4">
                {
                    pagina > 1 &&
                    <li className="page-item"><a className="page-link" onClick={retroceder}>Anterior</a></li>
                }
                <li className="page-item active"><a className="page-link" href="javascript:void(0);">{pagina}</a></li>
                {
                    haySiguiente
                    &&
                    <li className="page-item"><a className="page-link" onClick={avanzar}>Siguiente</a></li>
                }
            </ul>
        </div>
    )
}

export default Cursos;
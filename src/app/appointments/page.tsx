"use client";

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ description: '', date: '' });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Estado para controle do modal de exclusão
  const [appointmentToDelete, setAppointmentToDelete] = useState(null); // Estado para armazenar o compromisso a ser excluído

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/appointments');
      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched data:', data);

      // Certifique-se de que o retorno seja um array de compromissos
      setAppointments(data.member || []); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Delete appointment from API
  const deleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${appointmentToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAppointments(appointments.filter(appointment => appointment.id !== appointmentToDelete.id));
        setAppointmentToDelete(null); // Limpar o compromisso a ser deletado
        setShowDeleteModal(false);    // Fechar o modal de confirmação
      } else {
        throw new Error('Failed to delete appointment');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Create a new appointment
  const createAppointment = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAppointment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create appointment');
      }

      const savedAppointment = await response.json();
      setAppointments([...appointments, savedAppointment]);

      closeModal();  // Fecha o modal após salvar o compromisso
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  // Edit an existing appointment
  const editAppointment = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/merge-patch+json',
        },
        body: JSON.stringify(newAppointment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to edit appointment');
      }

      const updatedAppointment = await response.json();
      setAppointments(
        appointments.map(appointment =>
          appointment.id === selectedAppointment.id ? updatedAppointment : appointment
        )
      );

      closeModal();  // Fecha o modal após editar o compromisso
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  // Handle form submit based on whether editing or creating
  const handleSaveAppointment = () => {
    if (selectedAppointment) {
      editAppointment();  // Edit existing appointment
    } else {
      createAppointment(); // Create new appointment
    }
  };

  const openViewModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  const openEditModal = (appointment) => {
    setSelectedAppointment(appointment);
    const formattedDate = format(parseISO(appointment.date), "yyyy-MM-dd'T'HH:mm");
    setNewAppointment({ description: appointment.description, date: formattedDate });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedAppointment(null);
    setNewAppointment({ description: '', date: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setNewAppointment({ description: '', date: '' });
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedAppointment(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment({ ...newAppointment, [name]: value });
  };

  const openDeleteModal = (appointment) => {
    setAppointmentToDelete(appointment);  // Armazenar o compromisso a ser deletado
    setShowDeleteModal(true);  // Exibir o modal de confirmação
  };

  const closeDeleteModal = () => {
    setAppointmentToDelete(null);  // Limpar o compromisso a ser deletado
    setShowDeleteModal(false);     // Fechar o modal de confirmação
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className='container text-center'>
      <h1>Appointments</h1>

      <button onClick={openCreateModal} className="btn btn-primary mb-3">
        <i className="bi bi-plus-circle"></i> New Appointment
      </button>

      <ul className="list-group">
        {appointments && appointments.length > 0 ? (
          appointments.map((appointment) => {
            const formattedDate = format(parseISO(appointment.date), 'dd/MM/yyyy, HH:mm');

            return (
              <li key={appointment.id} className="list-group-item d-flex justify-content-between align-items-center">
                {appointment.description} : {formattedDate}
                <div>
                  <button onClick={() => openViewModal(appointment)} className="btn btn-info btn-sm mr-2">
                    <i className="bi bi-eye"></i> View
                  </button>
                  <button onClick={() => openEditModal(appointment)} className="btn btn-warning btn-sm mr-2">
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                  <button onClick={() => openDeleteModal(appointment)} className="btn btn-danger btn-sm">
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </div>
              </li>
            );
          })
        ) : (
          <li className="list-group-item">No appointments found</li>
        )}
      </ul>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedAppointment ? 'Edit Appointment' : 'Create New Appointment'}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="form-group text-left">
                  <label>Description:</label>
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    value={newAppointment.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group text-left">
                  <label>Date and Time:</label>
                  <input
                    type="datetime-local"
                    name="date"
                    className="form-control"
                    value={newAppointment.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={handleSaveAppointment} className={selectedAppointment ? 'btn btn-primary' : 'btn btn-success'}>{selectedAppointment ? 'Update' : 'Save'}</button>
                <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {showViewModal && selectedAppointment && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">View Appointment</h5>
                <button type="button" className="btn-close" onClick={closeViewModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p><strong>Description:</strong> {selectedAppointment.description}</p>
                <p><strong>Date and Time:</strong> {format(parseISO(selectedAppointment.date), 'dd/MM/yyyy, HH:mm')}</p>
              </div>
              <div className="modal-footer">
                <button onClick={closeViewModal} className="btn btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && appointmentToDelete && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the appointment: "{appointmentToDelete.description}"?</p>
              </div>
              <div className="modal-footer">
                <button onClick={deleteAppointment} className="btn btn-danger">Yes, Delete</button>
                <button onClick={closeDeleteModal} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
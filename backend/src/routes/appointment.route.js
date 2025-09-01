// phycare/backend/src/routes/appointment.route.js

import express from 'express';
import { jwtVerify } from '../middlewares/auth.middleware.js';
import { 
    getAppointmentsByDoctor, 
    getAppointmentsByPatient, 
    getLoggedInDoctorAppointments,
    getAppointmentById // 👈 Import the new controller function
} from '../controllers/appointment.controller.js';

const appointmentRouter = express.Router();

// Existing Routes
appointmentRouter.get('/by-doctor/:doctorId', jwtVerify, getAppointmentsByDoctor);
appointmentRouter.get('/patient', jwtVerify, getAppointmentsByPatient);
appointmentRouter.get('/doctor', jwtVerify, getLoggedInDoctorAppointments);

// 👇 New route for the video call page to fetch details
appointmentRouter.get('/:id', jwtVerify, getAppointmentById);

export default appointmentRouter;
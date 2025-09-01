import express from 'express'
import cors from 'cors'

import patientRouter from './routes/patient.route.js'
import doctorRouter from './routes/doctor.route.js'
import appointmentRouter from './routes/appointment.route.js'
import paymentRouter from './routes/payment.route.js'


const app = express()

// Middlewares 
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Allow your frontend to connect
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/patient', patientRouter)
app.use('/api/v1/doctor', doctorRouter)
app.use('/api/v1/appointment', appointmentRouter)
app.use('/api/v1/payment', paymentRouter)
app.use("/api/v1/appointments", appointmentRouter)

app.use('/api/v1/patients', patientRouter) 

// Change '/doctor' to '/doctors' - THIS FIXES THE 404 ERROR
app.use('/api/v1/doctors', doctorRouter)  


export { app }
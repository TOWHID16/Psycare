// phycare/backend/src/controllers/appointment.controller.js

import mongoose from "mongoose";
import { Appointment } from "../models/appointment.model.js";
import { Patient } from "../models/patient.model.js";

// This secure function gets appointments for the CURRENTLY LOGGED-IN doctor.
const getLoggedInDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const appointments = await Appointment.find({ doctorId: doctorId })
            .populate('patientId', ' name email') 
            .sort({ createdAt: -1 }); 

        res.status(200).json({
            success: true,
            message: "Appointments fetched successfully",
            data: appointments,
        });
    } catch (error) {
        console.error("Error fetching logged-in doctor's appointments:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching appointments' });
    }
};

const getAppointmentsByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const objectId = new mongoose.Types.ObjectId(doctorId);

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: "Invalid doctor ID" });
        }
        
        const appointments = await Appointment.find({ doctorId: objectId });
        res.status(200).json({ success: true, appointments });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching appointments' });
    }
};

const getAppointmentsByPatient = async (req, res) => {
    const id = req.user._id;

    if (!id) {
        return res.status(400).json({ success: false, message: "Invalid patient ID" });
    }

    try {
        const appointments = await Appointment.find({ patientId: id })
            .populate('doctorId', 'fullName profilePic')
            .lean();

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 👇 This is the new function required for the video call page
export const getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctorId', 'fullName email') // Corrected to use doctorId and fullName
            .populate('patientId', 'name email');   // Corrected to use patientId

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Security Check: Ensure the user requesting is part of the appointment
        const userId = req.user._id.toString();
        const isParticipant = userId === appointment.doctorId._id.toString() || userId === appointment.patientId._id.toString();

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this appointment' });
        }

        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};


export {
    getAppointmentsByDoctor,
    getAppointmentsByPatient,
    getLoggedInDoctorAppointments,
    // getAppointmentById is already exported above, but including it here is fine too.
}
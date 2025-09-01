import { Doctor } from "../models/doctor.model.js";
import validator from "validator";
import { ApiError } from "../utils/ApiError.js";
import { Story } from "../models/story.model.js";
import { Appointment } from "../models/appointment.model.js"; //
// Utility to generate access and refresh token
 import { Patient } from '../models/patient.model.js';
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const doctor = await Doctor.findById(userId);
    const accessToken = doctor.generateAccessToken();
    const refreshToken = doctor.generateRefreshToken();

    doctor.refreshToken = refreshToken;
    await doctor.save({ validateBeforeSave: false });

    return { accessToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Problem occurred while creating Access token");
  }
};


// backend/src/controllers/doctor.controller.js

const doctorRegister = async (req, res) => {
  try {
    // --- DATA RECEPTION AND VALIDATION ---

    // STEP 1: Destructure fields matching EXACTLY what the frontend sends.
    const {
      fullName,
      email,
      password,
      phoneNumber,       // CHANGED from 'phone'
      specializations,   // CHANGED from 'specialization'
      bio,
      address,
      education,         // This is now a JSON string: '{"degree":"...", "university":"...", "year":"..."}'
      workExperience,
      licenseNumber,     // CHANGED from 'license'
      appointmentFee,    // CHANGED from 'fees'
    } = req.body;

    // STEP 2: Handle file uploads from Multer/Cloudinary. This part was already good!
    const certificateFile = req.files?.certificate?.[0];
    const profilePicFile = req.files?.profilePic?.[0];

    // --- VALIDATION LOGIC (Mostly unchanged, but simplified) ---

    // Check for missing fields
    const requiredFields = { fullName, email, password, phoneNumber, specializations, bio, address, education, workExperience, licenseNumber, appointmentFee };
    for (const [key, value] of Object.entries(requiredFields)) {
        if (!value || value.trim() === "") {
            return res.status(400).json({ success: false, message: `Field is required: ${key}` });
        }
    }

    if (!certificateFile || !profilePicFile) {
      return res.status(400).json({ success: false, message: "Both certificate and profile picture are required" });
    }

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({ success: false, message: "A doctor with this email already exists" }); // 409 Conflict is more specific
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 6) { // It's good practice to enforce a slightly longer password
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // --- DATA PREPARATION ---

    // STEP 3: Parse the 'education' JSON string from the form.
    let educationData;
    try {
        educationData = JSON.parse(education);
    } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid education data format." });
    }

    // --- DATABASE CREATION ---

    // STEP 4: Create the doctor object with fields matching your 'doctor.model.js'
    const doctor = await Doctor.create({
      fullName,
      email,
      password,
      phone: phoneNumber,                  // Map to 'phone'
      specialization: specializations.split(",").map(s => s.trim()), // Clean and split string into an array
      bio,
      address,
      workExperience,
      license: licenseNumber,              // Map to 'license'
      fees: Number(appointmentFee),        // Map to 'fees' and ensure it's a Number
      certificate: certificateFile.path,   // Get path from Cloudinary
      profilePic: profilePicFile.path,     // Get path from Cloudinary
      // Map education fields
      degree: educationData.degree,
      medicalCollege: educationData.university, // Map 'university' to 'medicalCollege'
      yearOfCompletion: educationData.year,
    });
    
    // --- SUCCESS RESPONSE ---
    
    // STEP 5: Send a simple success response. No token, no auto-login.
    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully. Please log in.",
    });

  } catch (error) {
    console.error("Register Doctor Error:", error);
    // Send a generic server error
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred during registration.",
    });
  }
};

const doctorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await doctor.isPasswordCorrect(password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const { accessToken } = await generateAccessAndRefreshToken(doctor._id);

    const loggedInDoctor = await Doctor.findById(doctor._id).select(
      "-password"
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: loggedInDoctor,
      token: accessToken,
    });
  } catch (error) {
    console.log("Doctor login error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong during login",
    });
  }
};

const commentOnStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }

    // console.log(`In controller: ${req.user.role}`);

    // Check if logged-in user is a doctor
    if (req.role !== "doctor") {
      return res
        .status(403)
        .json({ success: false, message: "Only doctors can comment" });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    story.comments.push({
      doctor: req.user._id,
      text,
    });

    await story.save();

    const commentedStory = await Story.findById(storyId).populate(
      "comments.doctor",
      "fullName profilePic"
    );

    res.status(200).json({
      success: true,
      commentedStory,
      message: "Comment added successfully",
      story,
    });
  } catch (error) {
    console.error("Comment error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const editComment = async (req, res) => {
  try {
    const { storyId, commentId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }

    const story = await Story.findById(storyId);

    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    const comment = story.comments.id(commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    // Ensure only the same doctor who created it can edit
    if (comment.doctor.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to edit this comment" });
    }

    comment.text = text;
    await story.save();

    res.status(200).json({ success: true, message: "Comment updated", story });
  } catch (error) {
    console.error("Edit Comment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { storyId, commentId } = req.params;

    const story = await Story.findById(storyId);

    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    const comment = story.comments.id(commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    if (comment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this comment",
      });
    }

    comment.deleteOne(); // or comment.remove() if using older Mongoose
    await story.save();

    res.status(200).json({ success: true, message: "Comment deleted", story });
  } catch (error) {
    console.error("Delete Comment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({})
      .select("-password -refreshToken") // Exclude sensitive fields
      .sort({ createdAt: -1 }); // Optional: sort newest first

    res.status(200).json({
      success: true,
      doctors,
      message: "Doctors fetched successfully",
    });
  } catch (error) {
    console.error("Get All Doctors Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch doctors",
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId).select("-password -refreshToken");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      doctor,
      message: "Doctor fetched successfully",
    });
  } catch (error) {
    console.error("Get Doctor by ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch doctor",
    });
  }
};
// in backend/src/controllers/doctor.controller.js
// backend/src/controllers/doctor.controller.js

// backend/src/controllers/doctor.controller.js

const getTodaysSchedule = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const today = new Date();
        const dateString = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

        // --- THE FINAL FIX IS HERE ---
        const appointments = await Appointment.find({
            doctorId: doctorId,
            date: dateString ,// <-- CHANGED from 'appointmentDate' to 'date'
             status: "confirmed" 
              
        })
         .populate('patientId', 'name') 
        .sort({ timeSlot: 'asc' });

        return res.status(200).json({
            success: true,
            schedule: appointments,
        });

    } catch (error) {
        console.error("Error fetching today's schedule:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch today's schedule."
        });
    }
};
// backend/src/controllers/doctor.controller.js

const getAllStories = async (req, res) => {
    try {
        const stories = await Story.find({})
            .sort({ createdAt: -1 })
            // --- THE FIX IS ON THIS LINE ---
            // Replace 'patient' with 'uploadedBy' to match your Story model
            .populate('uploadedBy', 'name profilePic')
               .populate('comments.doctor', 'fullName profilePic'); 
        return res.status(200).json({
            success: true,
            stories: stories,
        });

    } catch (error) {
        console.error("Error fetching stories:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch community stories."
        });
    }
};
// 1. ADD THIS NEW FUNCTION
 // --- PASTE THIS ENTIRE FUNCTION into doctor.controller.js, BEFORE the export statement ---

// This function gets all unique patients who have an appointment with the logged-in doctor.
const getDoctorClients = async (req, res) => {
    try {
        // 1. Get the logged-in doctor's ID from the auth middleware.
        const doctorId = req.user._id;

        // 2. Find all appointments for this doctor.
        const appointments = await Appointment.find({ doctorId: doctorId }).select('patientId');

        // 3. Get an array of unique patient IDs.
        const patientIds = [...new Set(appointments.map(appt => appt.patientId.toString()))];

        // 4. Fetch the full profiles for these unique patient IDs.
        const clients = await Patient.find({
            '_id': { $in: patientIds }
        }).select('name email createdAt');

        // 5. Send the successful response.
        return res.status(200).json({
            success: true,
            message: "Clients fetched successfully",
            data: clients,
        });

    } catch (error) {
        console.error("Error fetching doctor's clients:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch clients."
        });
    }
};
export {
  doctorRegister,
  doctorLogin,
  commentOnStory,
  editComment,
  deleteComment,
  getAllDoctors,
  getTodaysSchedule,
  getAllStories,
   getDoctorClients ,
  getDoctorById
};

Streaming Video Analysis
Preparation¶
We offer connection to our streaming video analysis service via SocketIO (protocol revision 5).

The streaming video analysis service expects to recieve base64 encoded video frames captured at a frame rate of at least 6 frames per second (FPS) at a resolution of at least 640x480 pixels (landscape wxh), or 480x640 (portrait wxh).

Connecting to the SocketIO Server¶
Once you have a video feed established from the device your client application is running on, you will need to create a connection (either secure websocket wss:// or https://) to the socket at the URL we have provided to you using the following connection parameters (using the JavaScript client as an example):

connectionParams = {
    "bpCalibrated": bool,
    "checkArrhythmias": bool,
    "checkStroke": bool,
    "client": str,
    "diastolicAdj": float 
    "longMeasurement": bool,
    "party": str,
    "sampleTime": int,
    "storeResult": bool,
    "systolicAdj": float,
    "user_age": int[0,120]
    "user_sex": str[female,male]
}

socket = io("wss://<URL>/process_frame", {
    transports: ["websocket"],
    forceNew: true,
    withCredentials: true,
    auth: {
        Authorization: "Bearer <BEARER TOKEN FROM LOGIN>"
    },
    query: connectionParams
});
Note: the namespace used for all messages over the socket is /process_frame

The connection parameters govern which analyses will be performed, how long the recording should last and other options for the measurements. Each of the parameters is explained here:

bpCalibrated [bool]: Has the user performed a calibration of their blood pressure readings from the vitals app against a blood pressure monitor device? (Instructions for how to perform BP calibration are contained in the REST API documentation)
checkArrhythmias [bool]: Check the vitals measured for signs of cardiac arrhythmia?
checkStroke [bool]: Check the person's face for signs of stroke and/or Bell's palsy?
client [str]: Identifier provided to you for your client application
diastolicAdj [float]: Only required if BP calibration has been performed and bpCalibrated is set to True
longMeasurement [bool]: Will take measurements for 100 seconds (default: False)
party [str]: Identifier for your patient (to be used in conjunction with data to be sent to the dashboard)
sampleTime [int]: This should be set to 30 seconds, unless we inform you otherwise
storeResult [bool]: Whether or not to store the measurement against the user's profile
systolicAdj [float]: Only required if BP calibration has been performed and bpCalibrated is set to True
user_age [int][0, 120]: The user's age. Can be sent along with user_sex to adjust uncalibrated blood pressure result, otherwise it is ignored and can be omitted
user_sex [str][female,male]: The user's sex. Can be sent along with user_age to adjust uncalibrated blood pressure result, otherwise it is ignored and can be omitted
Sending Video Frames¶
With the socket connnected you can now proceed to send video frames along with some metadata in the following format:

imageAndMetadata = {
    "frameNumber": int,
    "imageData": base64 str,
    "remoteVitals": bool, 
    "stop": bool,
    "timeLapse": float,
    "userEmail": str
}
Here are the field descriptions:

frameNumber [int]: Number of the frame that is being sent with this message (counted from the frame attached to the first message that is sent)
imageData [base64 str]: Base64 encoded video frame data
remoteVitals [bool]: Used to flag if the video is coming from a remote video feed for use in telemedicine (not used outside of AI Nexus internal apps, default: False)
stop [bool]: If set to True will immediately stop the measurement and disconnect the socket
timeLapse [float]: Time in seconds since video frame streaming started
userEmail [str]: User identifier
Each imageAndMetadata message should be sent with the subject message:

socket.emit("message", imageAndMetadata);

Server message Response¶
If the video frame could be correctly processed the server will respond with a message with the subject result and the following format:

result = {
    "calculation_parameters": {
        "all_frames_processed": bool,
        "bb_colour": list[int],
        "bb_points": list[int],
        "client_timelapse": float,
        "face_detected": bool,
        "face_moved": bool,
        "face_rect": list[int],
        "finger_detected": bool,
        "fps": float,
        "fps_frame_processing": float,
        "frames_needed": int,
        "frame_number": int,
        "illumination_changed_count": int,
        "min_rr_intervals_reached": bool,
        "motion_detected_count": int,
        "N": int,
        "server_timelapse": float,
        "stable_readings": bool,
        "timeout": bool,
    },
    "request_parameters": {
        "check_arrhythmias": bool,
        "check_stroke": bool,
        "long_measurement": bool,
        "required_rr_length": int,
        "sample_time": int,
    },
    "vitals_results": {
        "confidence": float,
        "heart_rate": int,
        "hrv_rate": int,
        "mean_rr": int,
        "perfusion_index": float,
        "raw_rr_intervals": list[int],
        "resp_rate": int,
        "resp_rate_motion": int,
        "rr_intervals": list[int],
        "spo2_rate": int
    },
}
The field definitions are as follows:

Calculation Parameters¶
These parameters are either used in the calculations of vitals, or for monitoring the measurements

all_frames_processed [bool]: Used for video file processing only
bb_colour list[lint]: RGB colour of the bounding box of the detected face (if any)
bb_points list[int]: Top left and bottom right co-ordinates of the bounding box of the detected face (if any)
client_timelapse [float]: Total time (in seconds) since client started sending frames (same as timelapse sent in frame meta data)
face_detected [bool]: Flag to confirm if a face was detected in the frame or not
face_moved [bool]: Flag to show if the face moved more than a permitted amount compared to the previous frame that was recieved, that would adversely affect the calculations
face_rect list[int]: Top left, width and height co-ordinates of face detection box (if any)
finger_detected [bool]: For finger reading, is a finger detected (as opposed to face). Used to determine correct calculation method
fps [float]: Rate at which frames are read by the server (frames per second)
fps_frame_processing [float]: Rate at which calculations are processed by the server (frames per second)
frames_needed [int]: For video file processing only
frame_number [int]: Frame number received from client that has been processed in this result
illumination_change_count [int]: Count of the number of time that the lighting across the subjects face changed during measurement above a preset threshold that could adversely affect the calculations
min_rr_intervals_reached [bool]: For checking arrhythmias, was the minimum nunber of RR intervals required reached
motion_detected_count [bool]: Count of the number of time the subject moved more than a preset amount that could adversely affect the calculations
N [int]: Parameter used in calculations
server_timelapse [float]: Total time (in seconds) since the server started measurement calculations
stable_readings [bool]: Flag to confirm if calculations were completed successfully
timeout [bool]: Flag to indicate that the requested measurement time was reached without reaching stable readings
Request Parameters¶
These are the parameters set in the connection to the socket

check_arrhythmias [bool]: Check for signs of cardiac arrhythmia in vitals
check_stroke [bool]: Check for signs of stroke or Bell's palsy in image of user's face in final video frame
long_measurement [bool]: Perform a 100 second measurement
required_rr_length [int]: Preset number of RR intervals to collect for checking for arryhthmia (not client configurable)
sample_time [int]: Maximum measurement time in seconds (should be set to 30 seconds)
Vitals Results¶
confidence [float]: Confidence in accuracy of vitals measurements (in percent). Will be particularly affected by illumination changes, or movement of subject
heart_rate [int]: Calculated heart rate (in beats per minute)
hrv_rate [int]: Calculated heart rate variability (HRV) (RMSSD method in milliseconds)
mean_rr [int]: Calculated mean of RR intervals (in milliseconds)
perfusion_index [float]: Calculated ratio of pulsatile blood flow to static blood in peripheral tissue
raw_rr_intervals list[int]: RR intervals collected prior to processing
resp_rate [int]: Calculated respiration rate (in breaths per minute), implied from heart rate
resp_rate_motion [int]: Calculated respiration rate (in breaths per minute), determined by breathing motion of subject
rr_intervals list[int]: Final RR intervals used for arrhythmia check (in milliseconds)
spo2_rate [int]: Calculated blood oxygen saturation level (in percent)
Vitals Measurement Completion¶
At the end of a measurement you will recieve either a stable_readings message to indicate that measurement was successful, or a timeout message to indicate that we were not able to complete the measurements due to insufficiently consistent video data and you should ask the subject to take another measurement.

Following the stable_readings message you will recieve some/all of the following messages according to the original request parameters at their respective message subjects

Blood Pressure (BP) Result¶
Blood pressure calculation is attempted providing that at least 7 secs of consistent heart rates (+/-5%) can be collected during the measurement period. Whether or not the result is calibrated to an individual is set in the options when connnecting to the socket.

This message is sent with the subject blood_pressure_result and has the following format:

blood_pressure_result = {
    "bp_calibrated": bool,
    "calibrated_diastolic_blood_pressure": float,
    "calibrated_systolic_blood_pressure": float,
    "diastolic_adj": float,
    "diastolic_blood_pressure": float,
    "systolic_adj": float,
    "systolic_blood_pressure": float,
}
The field definitions are as follows:

bp_calibrated [bool]: Flag to show if the reported blood pressures have been calibrated using the adjustments provided in the socket connection parameters
calibrated_diastolic_blood_pressure [float]: Calculated diastolic blood pressure (in mmHG) after applying subject's calibration adjustment, otherwise null if BP has not been calibrated
calibrated_systolic_blood_pressure [float]: Calculated systolic blood pressure (in mmHG) after applying subject's calibration adjustment, otherwise null if BP has not been calibrated
diastolic_adj [float]: Diastolic calibration adjustment (number the system generated diastolic measurement should be multiplied by for this user)
diastolic_blood_pressure [float]: Calculated uncalibrated diastolic blood pressure (in mmHG)
systolic_adj [float]: Systolic calibration adjustment (number the system generated systolic measurement should be multiplied by for this user)
systolic_blood_pressure [float]: Calculated uncalibrated systolic blood pressure (in mmHG)
Arrhythmia Check Result¶
This message is sent with the subject arrhythmia_result and has the following format:

arrhythmia_detection_result = {
    "atrial_fibrillation": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": bool,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    },
    "atrial_flutter": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": bool,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    },
    "apnea": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": bool,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    },
    "congestive_heart_failure": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": true,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    },
    "heart_block": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": true,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    },
    "myocardial_infarction": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": true,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    },
    "premature_ventricular_contractions": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": true,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    },
    "sinus_bradycardia": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": true,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    },
    "supraventricular_tachycardia": {
        "api_name": str,
        "arrhythmia_name": str,
        "confidence": float,
        "detected": true,
        "error_msg": str,
        "prediction": str,
        "request_id": str,
        "success": bool
    }
}
The conditions that we check for are:

Atrial Fibrillation (AFIB)
Atrial Flutter
Congestive Heart Failure (CHF)
Heart Block
Myocardial Infarction
Premature Ventricular Contractions (PVCs)
Sinus Bradycardia
Sleep Apnea (Only relevant if measurement taken when subject is sleeping)
Supraventricular Tachycardia (SVT)
For each of the condiions the field definitions are:

api_name [str]: Name of API that calculated the result for the relevant condition
arrhythmia_name [str]: Name of the condition that was checked for
confidence [float]: The confidence of the model in it's detection of the condition (in percent)
detected [bool]: Flag that indicates whether or not the condition was detected
error_msg [str]: Any error messgae from the API that checked for the condition
prediction [str]: String to describe if the condition was detected or not
request_id [str]: Identifier of the request that was provided from the API that checked for the condition
success [bool]: Flag to indicate if the API successfully processed the detection request
Stroke Detection Result¶
This message is sent with the subject stroke_result and has the following format:

stroke_detection_result = {
    "algo": bool,
    "base64montage": str,
    "baseline_bells_palsy_prediction": {
        "color": list[int],
        "confidence": float,
        "detected": bool,
        "overall": str,
        "symmetry": str,
        "severity": str
    },
    "baseline_stroke_prediction": {
        "color": list[int],
        "confidence": float,
        "detected": bool,
        "overall": str,
        "symmetry": str,
        "severity": str
    },
    "current_bells_palsy_prediction": {
        "color": list[int],
        "confidence": float,
        "detected": bool,
        "overall": str,
        "symmetry": str,
        "severity": str
    },
    "current_stroke_prediction": {
        "color": list[int],
        "confidence": float,
        "detected": bool,
        "overall": str,
        "symmetry": str,
        "severity": str
    },
    "pose_analysis": [...]
    "request_id": str,
    "success": bool
}
The field definitions for the sections that are relevant to you are as follows:

algo [bool]: Calculation parameter returned from stroke detection API
base64montage [base64 str]: Base64 encoded image containing the all of the results of the stroke detection analysis
current_bells_palsy_prediction and current_stroke_prediction:
color list[int]: RGB color indicating the severity of the detected condition (if any)
confidence [float]: Confidence of the detection of the condition by the algorithm (in percent)
detected [bool]: Flag to indicate whether or not the condition was detected
overall [str]: String providing an overall summary of the analysis
symmetry [str]: String provifing a summary of the facial symmetry
severity [str]: String providing a summary of the severity of the detected condition (if any)
Completion of All Measurements¶
After receiving all of the relevant messages above amd depending on the parameters that were chosen when the socket connection was set up it is possible to close the socket connection and tear down the video frame capture function in the client

-- EMR + LLM schema
CREATE TABLE Users (
  Id INT IDENTITY PRIMARY KEY,
  FullName NVARCHAR(150),
  Email NVARCHAR(150) UNIQUE,
  PasswordHash NVARCHAR(255),
  Role NVARCHAR(50),
  CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Patients (
  PatientID INT IDENTITY PRIMARY KEY,
  FullName NVARCHAR(150),
  Contact NVARCHAR(150),
  Gender NVARCHAR(10),
  DateOfBirth DATE,
  CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE PatientVisits (
  VisitID INT IDENTITY PRIMARY KEY,
  PatientID INT FOREIGN KEY REFERENCES Patients(PatientID),
  VisitDate DATETIME DEFAULT GETDATE(),
  Notes NVARCHAR(MAX),
  CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Symptoms (
  SymptomID INT IDENTITY PRIMARY KEY,
  VisitID INT FOREIGN KEY REFERENCES PatientVisits(VisitID),
  SymptomText NVARCHAR(255),
  Severity INT,
  Duration NVARCHAR(50)
);

CREATE TABLE Diagnosis (
  DiagnosisID INT IDENTITY PRIMARY KEY,
  VisitID INT FOREIGN KEY REFERENCES PatientVisits(VisitID),
  DiagnosisText NVARCHAR(MAX),
  RecommendedTreatment NVARCHAR(MAX),
  SuggestedLabTests NVARCHAR(MAX),
  LLMSource NVARCHAR(50),
  CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Prescriptions (
  PrescriptionID INT IDENTITY PRIMARY KEY,
  VisitID INT NULL,
  PatientID INT NULL,
  Diagnosis NVARCHAR(MAX),
  MedicationList NVARCHAR(MAX),
  SuggestedByAI BIT DEFAULT 0,
  MedicineName NVARCHAR(255),
  Dosage NVARCHAR(100),
  Duration NVARCHAR(50),
  Instructions NVARCHAR(MAX),
  CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE LabTests (
  LabTestID INT IDENTITY PRIMARY KEY,
  Name NVARCHAR(150),
  Description NVARCHAR(MAX),
  Department NVARCHAR(50)
);

CREATE TABLE PatientLabReports (
  ReportId INT IDENTITY PRIMARY KEY,
  PatientId INT FOREIGN KEY REFERENCES Patients(PatientID),
  UploadedBy INT NULL,
  LabTestType VARCHAR(100),
  ReportText NVARCHAR(MAX),
  DiagnosisSummary NVARCHAR(MAX),
  AIModelUsed VARCHAR(50),
  CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE FeedbackTraining (
  FeedbackId INT IDENTITY PRIMARY KEY,
  RelatedType VARCHAR(50),
  RelatedId INT,
  OriginalAIOutput NVARCHAR(MAX),
  DoctorFeedback NVARCHAR(MAX),
  CorrectedOutput NVARCHAR(MAX),
  SubmittedBy INT,
  CreatedAt DATETIME DEFAULT GETDATE(),
  IsUsedInTraining BIT DEFAULT 0
);

CREATE TABLE ModelTrainingHistory (
  TrainingId INT IDENTITY PRIMARY KEY,
  ModelName VARCHAR(100),
  TrainingDate DATETIME DEFAULT GETDATE(),
  RecordsUsed INT,
  FineTunedModel VARCHAR(200),
  Status VARCHAR(50),
  Notes NVARCHAR(MAX)
);

CREATE TABLE PharmacyInventory (
  MedicineId INT IDENTITY PRIMARY KEY,
  MedicineName NVARCHAR(100),
  Dosage NVARCHAR(50),
  QuantityAvailable INT,
  Price DECIMAL(10,2),
  ExpiryDate DATE
);

CREATE TABLE Alerts (
  AlertId INT IDENTITY PRIMARY KEY,
  AlertType NVARCHAR(50),
  ReferenceId INT NULL,
  Message NVARCHAR(MAX),
  IsAcknowledged BIT DEFAULT 0,
  CreatedAt DATETIME DEFAULT GETDATE()
);

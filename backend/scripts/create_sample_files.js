import * as XLSX from 'xlsx';
import fs from 'fs';

const sampleStudents = [
  {
    "Roll Number": "24CS001",
    "Full Name": "Aarav Sharma",
    "Email": "aarav.sharma@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Computer Science",
    "Semester": 4,
    "Section": "A",
    "Phone": "+91 9876543201",
    "Address": "124 Green Park, Hyderabad"
  },
  {
    "Roll Number": "24CS002",
    "Full Name": "Ananya Patel",
    "Email": "ananya.patel@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Computer Science",
    "Semester": 4,
    "Section": "A",
    "Phone": "+91 9876543202",
    "Address": "45 Lakeview Enclave, Bangalore"
  },
  {
    "Roll Number": "24CS003",
    "Full Name": "Siddharth Rao",
    "Email": "siddharth.rao@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Computer Science",
    "Semester": 4,
    "Section": "B",
    "Phone": "+91 9876543203",
    "Address": "78 Hilltop Residency, Pune"
  },
  {
    "Roll Number": "24CS004",
    "Full Name": "Sneha Reddy",
    "Email": "sneha.reddy@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Computer Science",
    "Semester": 4,
    "Section": "B",
    "Phone": "+91 9876543204",
    "Address": "12 Cyber City, Hyderabad"
  },
  {
    "Roll Number": "24EC001",
    "Full Name": "Rohan Verma",
    "Email": "rohan.verma@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Electronics & Comm",
    "Semester": 4,
    "Section": "A",
    "Phone": "+91 9876543205",
    "Address": "34 Metro Towers, Chennai"
  },
  {
    "Roll Number": "24EC002",
    "Full Name": "Pooja Hegde",
    "Email": "pooja.hegde@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Electronics & Comm",
    "Semester": 4,
    "Section": "A",
    "Phone": "+91 9876543206",
    "Address": "89 Palm Meadows, Bangalore"
  },
  {
    "Roll Number": "24ME001",
    "Full Name": "Kavya Nair",
    "Email": "kavya.nair@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Mechanical Eng",
    "Semester": 4,
    "Section": "A",
    "Phone": "+91 9876543207",
    "Address": "15 Riverside Road, Kochi"
  },
  {
    "Roll Number": "24ME002",
    "Full Name": "Vikram Singh",
    "Email": "vikram.singh@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Mechanical Eng",
    "Semester": 4,
    "Section": "A",
    "Phone": "+91 9876543208",
    "Address": "92 Royal Crest, Delhi"
  },
  {
    "Roll Number": "24IT001",
    "Full Name": "Deepak Joshi",
    "Email": "deepak.joshi@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Information Tech",
    "Semester": 2,
    "Section": "A",
    "Phone": "+91 9876543209",
    "Address": "67 Silicon Valley, Noida"
  },
  {
    "Roll Number": "24IT002",
    "Full Name": "Meera Iyer",
    "Email": "meera.iyer@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Information Tech",
    "Semester": 2,
    "Section": "A",
    "Phone": "+91 9876543210",
    "Address": "23 Temple View, Chennai"
  },
  {
    "Roll Number": "24AI001",
    "Full Name": "Aditya Kulkarni",
    "Email": "aditya.kulkarni@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Artificial Intelligence",
    "Semester": 2,
    "Section": "A",
    "Phone": "+91 9876543211",
    "Address": "51 IT Park Road, Mumbai"
  },
  {
    "Roll Number": "24AI002",
    "Full Name": "Ishita Sen",
    "Email": "ishita.sen@collegeerp.com",
    "Default Password": "Student@123",
    "Department": "Artificial Intelligence",
    "Semester": 2,
    "Section": "A",
    "Phone": "+91 9876543212",
    "Address": "10 Salt Lake City, Kolkata"
  }
];

// Write XLSX
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleStudents);
XLSX.utils.book_append_sheet(wb, ws, 'Student Onboarding');
XLSX.writeFile(wb, 'sample_students_onboarding.xlsx');

// Write CSV
const csv = XLSX.utils.sheet_to_csv(ws);
fs.writeFileSync('sample_students_onboarding.csv', csv);

console.log('✔ Generated sample_students_onboarding.xlsx and sample_students_onboarding.csv successfully!');

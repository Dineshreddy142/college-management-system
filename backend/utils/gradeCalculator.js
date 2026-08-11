/**
 * UGC / AICTE Standard 10-Point Scale Grading Engine
 */

export function calculateGrade(marksObtained, maxMarks = 100) {
  const percentage = (Number(marksObtained) / Number(maxMarks)) * 100;
  
  if (percentage >= 90) {
    return { grade: 'O', points: 10, description: 'Outstanding', passed: true, percentage };
  } else if (percentage >= 80) {
    return { grade: 'A+', points: 9, description: 'Excellent', passed: true, percentage };
  } else if (percentage >= 70) {
    return { grade: 'A', points: 8, description: 'Very Good', passed: true, percentage };
  } else if (percentage >= 60) {
    return { grade: 'B+', points: 7, description: 'Good', passed: true, percentage };
  } else if (percentage >= 55) {
    return { grade: 'B', points: 6, description: 'Above Average', passed: true, percentage };
  } else if (percentage >= 50) {
    return { grade: 'C', points: 5, description: 'Average', passed: true, percentage };
  } else if (percentage >= 40) {
    return { grade: 'P', points: 4, description: 'Pass', passed: true, percentage };
  } else {
    return { grade: 'F', points: 0, description: 'Fail', passed: false, percentage };
  }
}

/**
 * Calculates Semester Grade Point Average (SGPA)
 * Formula: sum(credit_i * point_i) / sum(credit_i)
 */
export function calculateSGPA(subjectsMarks = []) {
  if (!subjectsMarks || subjectsMarks.length === 0) return 0.00;
  
  let totalCreditPoints = 0;
  let totalCredits = 0;
  
  for (const sub of subjectsMarks) {
    const credit = Number(sub.credits) || 3;
    const gradeInfo = calculateGrade(sub.marksObtained, sub.maxMarks || 100);
    totalCreditPoints += credit * gradeInfo.points;
    totalCredits += credit;
  }
  
  if (totalCredits === 0) return 0.00;
  return Number((totalCreditPoints / totalCredits).toFixed(2));
}

/**
 * Calculates Cumulative Grade Point Average (CGPA) from semester SGPAs
 */
export function calculateCGPA(semesterSgpas = []) {
  if (!semesterSgpas || semesterSgpas.length === 0) return 0.00;
  const validSgpas = semesterSgpas.map(Number).filter(n => !isNaN(n) && n > 0);
  if (validSgpas.length === 0) return 0.00;
  const sum = validSgpas.reduce((a, b) => a + b, 0);
  return Number((sum / validSgpas.length).toFixed(2));
}

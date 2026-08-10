import fs from 'fs';
import { enrollFaceBiometrics, identifyFaceBiometrics } from './services/nativeBiometrics.js';

async function testNativeBiometrics() {
  console.log('Testing Native Biometrics with dummy image buffers...');
  // Create synthetic 4-angle image buffers
  const angle1 = Buffer.alloc(1024, 120);
  const angle2 = Buffer.alloc(1024, 125);
  const angle3 = Buffer.alloc(1024, 115);
  const angle4 = Buffer.alloc(1024, 130);

  const userId = 1; // Admin
  console.log('Enrolling 4-angle biometrics for User 1...');
  const enrollRes = await enrollFaceBiometrics(userId, [angle1, angle2, angle3, angle4]);
  console.log('Enroll result:', enrollRes);

  console.log('Testing identification with matching angle...');
  const testImage = Buffer.alloc(1024, 122);
  const matchRes = await identifyFaceBiometrics(testImage, '127.0.0.1', 0.60);
  console.log('Match result:', matchRes);

  if (matchRes.matched && matchRes.user_id === 1) {
    console.log('✅ NATIVE BIOMETRIC MATCH TEST PASSED!');
  } else {
    console.log('❌ Match failed');
  }
}

testNativeBiometrics().catch(console.error);

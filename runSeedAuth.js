import { signInAnonymously, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './src/firebase/config.js';
import { autoAssignCategoryImages } from './src/scripts/seedCategoryImages.js';

async function run() {
  try {
    console.log('Authenticating...');
    try {
      await signInAnonymously(auth);
      console.log('Logged in anonymously.');
    } catch(e) {
      console.log('Anonymous login failed, trying email/pass creation...', e.message);
      const email = `testadmin_${Date.now()}@test.com`;
      await createUserWithEmailAndPassword(auth, email, "password123");
      console.log('Created and logged in with temporary user:', email);
    }

    console.log('Starting category image assignment...');
    const count = await autoAssignCategoryImages();
    console.log(`Successfully assigned existing luxury images to ${count} categories.`);
    process.exit(0);
  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

run();

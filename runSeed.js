import { autoAssignCategoryImages } from './src/scripts/seedCategoryImages.js';

async function run() {
  try {
    console.log('Starting category image assignment...');
    const count = await autoAssignCategoryImages();
    console.log(`Successfully assigned existing luxury images to ${count} categories.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();

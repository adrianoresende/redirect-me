const fs = require('fs-extra');
const path = require('path');
const terser = require('terser');
const { minify } = require('html-minifier-terser');
const archiver = require('archiver');
const packageJson = require('../package.json');

const distPath = path.join(__dirname, '..', 'dist');
const rootPath = path.join(__dirname, '..');

async function build() {
  try {
    console.log('Starting build...');
    // 1. Clean and create dist directory
    await fs.emptyDir(distPath);
    console.log('Cleaned dist directory.');

    // 2. Build Tailwind CSS
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('npm run minifycss', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error building Tailwind CSS: ${stderr}`);
          reject(error);
          return;
        }
        console.log(`Tailwind CSS build output: ${stdout}`);
        resolve();
      });
    });
    console.log('Tailwind CSS built successfully.');

    // 3. Copy and minify JS and other root files
    const filesToProcess = ['background.js', 'manifest.json', 'popup.js'];
    for (const file of filesToProcess) {
      const sourcePath = path.join(rootPath, file);
      const destPath = path.join(distPath, file);

      if (file.endsWith('.js')) {
        const code = await fs.readFile(sourcePath, 'utf-8');
        const minifiedCode = await terser.minify(code);
        if (minifiedCode.error) {
          throw new Error(`Error minifying ${file}: ${minifiedCode.error}`);
        }
        await fs.writeFile(destPath, minifiedCode.code);
      } else {
        await fs.copy(sourcePath, destPath);
      }
    }
    console.log('Copied and minified root files.');

    // 4. Copy images directory
    await fs.copy(path.join(rootPath, 'images'), path.join(distPath, 'images'));
    console.log('Copied images directory.');

    // 5. Copy and minify popup.html
    let popupHtml = await fs.readFile(
      path.join(rootPath, 'popup.html'),
      'utf-8'
    );
    const minifiedHtml = await minify(popupHtml, {
      removeComments: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
    });
    await fs.writeFile(path.join(distPath, 'popup.html'), minifiedHtml);
    console.log('Copied and minified popup.html.');

    // 6. Copy src directory to dist
    await fs.copy(
      path.join(rootPath, 'src'),
      path.join(distPath, 'src')
    );
    console.log('Copied src directory.');

    // 7. Create a zip file
    const output = fs.createWriteStream(path.join(distPath, `${packageJson.name}.zip`));
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    output.on('close', function () {
      console.log(`Zip file created: ${archive.pointer()} total bytes`);
    });

    archive.on('error', function (err) {
      throw err;
    });

    archive.pipe(output);
    archive.directory(distPath, false);
    await archive.finalize();

    console.log('✅ Extension built and zipped successfully!');
  } catch (err) {
    console.error('Error building extension:', err);
    process.exit(1);
  }
}

build(); 
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const lockPath = path.join(root, 'package-lock.json');
const distPath = path.join(root, 'dist');
const outputPath = path.join(distPath, 'THIRD_PARTY_NOTICES');
const lock = JSON.parse(await readFile(lockPath, 'utf8'));

const licenseNames = new Set([
  'LICENSE', 'LICENSE.MD', 'LICENSE.TXT', 'LICENCE', 'LICENCE.MD',
  'COPYING', 'COPYING.TXT', 'NOTICE', 'NOTICE.MD', 'NOTICE.TXT',
]);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

const packages = Object.entries(lock.packages)
  .filter(([packagePath, metadata]) =>
    packagePath.startsWith('node_modules/') && !metadata.dev,
  )
  .map(([packagePath, metadata]) => ({
    packagePath,
    name: packagePath.slice('node_modules/'.length),
    version: metadata.version ?? 'unknown',
    license: typeof metadata.license === 'string'
      ? metadata.license
      : JSON.stringify(metadata.license ?? 'UNSPECIFIED'),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

await mkdir(outputPath, { recursive: true });
const rows = [];
const missing = [];

for (const item of packages) {
  const packageDir = path.join(root, item.packagePath);
  let files = [];
  try {
    files = await readdir(packageDir, { withFileTypes: true });
  } catch {
    missing.push({ ...item, reason: 'package directory not found' });
    continue;
  }

  const matching = files.filter((file) =>
    file.isFile() && licenseNames.has(file.name.toUpperCase()),
  );

  const safeName = item.name.replaceAll('/', '__').replaceAll('@', '');
  const destination = path.join(outputPath, safeName);
  await mkdir(destination, { recursive: true });
  const copied = [];

  for (const file of matching) {
    const source = path.join(packageDir, file.name);
    const target = path.join(destination, file.name);
    await copyFile(source, target);
    copied.push(`THIRD_PARTY_NOTICES/${safeName}/${encodeURIComponent(file.name)}`);
  }

  if (copied.length === 0) {
    missing.push({ ...item, reason: 'no LICENSE/COPYING/NOTICE file found' });
  }

  rows.push({
    ...item,
    files: copied,
    source: `https://www.npmjs.com/package/${item.name}/v/${item.version}`,
  });
}

const ownLicenseDir = path.join(outputPath, 'project');
await mkdir(ownLicenseDir, { recursive: true });
for (const file of ['LICENSE', 'LICENSE-PT-BR.md', 'NOTICE']) {
  try {
    await copyFile(path.join(root, file), path.join(ownLicenseDir, file));
  } catch {
    // The build can still finish; the missing project document is reported below.
    missing.push({ name: file, reason: 'project notice could not be copied' });
  }
}

const packageRows = rows.map((item) => {
  const links = item.files.length
    ? item.files.map((file) => `<a href="${encodeURI(file)}">${escapeHtml(path.basename(file))}</a>`).join(' · ')
    : '<span class="missing">Arquivo de licença não encontrado no pacote; consulte a origem.</span>';
  return `<tr><td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.version)}</small></td><td>${escapeHtml(item.license)}</td><td>${links}</td><td><a href="${escapeHtml(item.source)}">npm</a></td></tr>`;
}).join('\n');

const missingHtml = missing.length
  ? `<section class="warning"><h2>Itens que exigem conferência</h2><p>O coletor não encontrou arquivo de licença para os seguintes itens. Consulte o pacote de origem antes de redistribuir o aplicativo:</p><ul>${missing.map((item) => `<li>${escapeHtml(item.name)} — ${escapeHtml(item.reason)}</li>`).join('')}</ul></section>`
  : '<p>Todos os pacotes npm de execução identificados tiveram pelo menos um arquivo de licença/aviso copiado.</p>';

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>Licenças e créditos — NexusMIDI Pro</title>
<style>
body{font-family:system-ui,sans-serif;max-width:1100px;margin:auto;padding:24px;line-height:1.55;background:#0b1020;color:#e5e7eb}
a{color:#93c5fd}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #475569;vertical-align:top}
section{margin:24px 0;padding:18px;border:1px solid #475569;border-radius:12px}.warning{border-color:#d97706}
small{color:#cbd5e1}.missing{color:#fbbf24}
</style></head>
<body>
<h1>Licenças e créditos / Licenses and notices</h1>
<p>O código original do NexusMIDI Pro é licenciado sob MIT. Cada biblioteca de terceiros mantém sua própria licença e seus avisos originais. Esta página e os arquivos vinculados são gerados durante o build a partir do package-lock.json e dos pacotes npm instalados.</p>
<p>The original NexusMIDI Pro code is licensed under MIT. Each third-party library retains its own license and original notices. This page and its linked files are generated at build time from package-lock.json and the installed npm packages.</p>
<section><h2>Pacotes npm de execução / npm runtime packages</h2>
<p>${packages.length} pacotes npm de execução foram identificados nesta compilação. Os arquivos de licença/NOTICE encontrados são copiados para esta distribuição.</p>
<table><thead><tr><th>Pacote / versão</th><th>Identificador</th><th>Arquivos originais</th><th>Origem</th></tr></thead><tbody>${packageRows}</tbody></table>
</section>
${missingHtml}
<section><h2>Componentes Android nativos</h2>
<ul>
<li>AndroidX AppCompat 1.7.1 — Apache-2.0</li>
<li>AndroidX CoordinatorLayout 1.3.0 — Apache-2.0</li>
<li>AndroidX Core SplashScreen 1.2.0 — Apache-2.0</li>
<li>Apache Cordova Android Framework 14.0.1 — Apache-2.0</li>
<li>Capacitor Android e plugins 8.x — MIT</li>
</ul>
<p>O conjunto transitivo exato é resolvido pelo Gradle e pode variar por build. Consulte THIRD_PARTY_LICENSES.md no repositório e confira o relatório Gradle do artefato distribuído.</p>
<p><a href="licenses/Apache-2.0.txt">Texto Apache-2.0</a> · <a href="licenses/MIT.txt">Texto MIT do projeto</a> · <a href="licenses/ISC.txt">Texto ISC</a> · <a href="licenses/0BSD.txt">Texto 0BSD</a></p>
</section>
<section><h2>Licença e avisos do projeto</h2>
<ul><li><a href="THIRD_PARTY_NOTICES/project/LICENSE">MIT License do código original</a></li><li><a href="THIRD_PARTY_NOTICES/project/LICENSE-PT-BR.md">Tradução informativa MIT (PT-BR)</a></li><li><a href="THIRD_PARTY_NOTICES/project/NOTICE">NOTICE e créditos</a></li></ul>
</section>
<section><h2>Marcas e SoundFonts</h2>
<p>O NexusMIDI Pro é um projeto independente e não é endossado nem afiliado à MIDI Manufacturers Association, Roland Corporation, Yamaha Corporation, Creative Technology Ltd. ou E-mu Systems, Inc. SoundFont® é marca registrada da Creative Technology Ltd. As demais marcas pertencem a seus respectivos titulares.</p>
<p>O aplicativo não fornece arquivos SoundFont. Importe somente arquivos que você tenha direito de usar. A capacidade técnica de abrir um arquivo não concede autorização para reproduzi-lo, compartilhá-lo ou redistribuí-lo.</p></section>
<p><a href="https://github.com/rodolphofriedrich-gif/nexus-midi-pro-2/blob/main/THIRD_PARTY_LICENSES.md">Inventário completo e documentação no repositório</a></p>
</body></html>`;

await writeFile(path.join(distPath, 'THIRD_PARTY_NOTICES.html'), html, 'utf8');
console.log(`Collected license files for ${rows.length} npm runtime packages.`);
if (missing.length) {
  console.warn(`License files requiring manual review: ${missing.length}`);
  for (const item of missing) console.warn(`- ${item.name}: ${item.reason}`);
}

// One-off script to bulk-register real-world Pune libraries as unclaimed,
// publicly-live directory listings (owner requested "publicly live", not a
// private prospect list). Each gets a placeholder owner account so the
// listing has a valid owner_id; the real owner can claim it later via a
// password-reset-style flow once that exists.
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { slugify } from '../utils/slugify.js';

const PLACEHOLDER_PASSWORD = 'ClaimYourLibrary@2026';

// [name, phone (10-digit or null), email (or null), area/address (or null)]
const ENTRIES = [
  ['Waari Abhyasika', '9764492349', null, null],
  ['Aspirant Abhyasika', '8088708708', null, null],
  ['Study Zone Reading Room', '7066577691', null, null],
  ['The Aspirants Library', '9673976787', null, null],
  ['Readers Club', '9527868668', null, null],
  ['Swarajya Global Abhyasika', '7588959401', null, null],
  ['YASHADA LIBRARY', '7264005575', null, null],
  ["Officer's Club Study Room", '9156364847', null, null],
  ['Race Library Abhyasika', null, null, null],
  ['New Savitri Library & Reading Room', '9527360321', null, null],
  ['Swamini Library', '9699601993', null, null],
  ['Global Library', '7588959401', null, null],
  ['Dnyanjyoti Abhyasika – Kumthekar Road', '9307598729', null, null],
  ['Prerana Abhyasika', '8087764427', null, null],
  ['Guru Abhyasika', '9404481094', null, null],
  ['Maharashtra Abhyasika', '7798960279', null, null],
  ['Success Study Point', '9075969749', null, null],
  ['Swami Samarth Study Room', null, null, null],
  ['Swamini Library', '9699601993', null, null],
  ['Study Hub', '7083777186', null, null],
  ['Wisdom Abhyasika', '7588882999', null, null],
  ['Dnyanjyoti Study Room – LBS Road', '7887992835', null, null],
  ['Study Point Library', '7798405284', 'ramesh.phadtare18@gmail.com', null],
  ['Pioneer Library Pune', '8830449779', null, null],
  ['Liberty Library', null, null, null],
  ['Saraswati Abhyasika', null, null, null],
  ['Vallabhi Abhyasika', '9307804205', null, null],
  ['Ahilya Shikshan Mandal', null, null, null],
  ['MS Gauri', null, null, null],
  ['Eduvision Studyhub', null, null, null],
  ['Drona Abhyasika', null, null, null],
  ['Careers Hub Study Room', null, null, null],
  ['Geetanand Reading Room', null, null, null],
  ["Vinod Reddy's Study Centre", null, null, null],
  ['Peace Cube Study Room', null, null, null],
  ['Sankalp Abhyasika', null, null, null],
  ['Shivneri Study', null, null, null],
  ['Morya Abhyasika', null, null, null],
  ['Satyaki Abhyasika', null, null, null],
  ['Study Cubes (StudyRooms.in)', null, null, null],
  ['Dnyansparsh Abhyasika', null, null, null],
  ['Gyanjyoti Book House & Reading Room', null, null, null],
  ['Abhyas Mandal Library', '7507081414', null, null],
  ['Swami Vivekanand Abhyasika', null, null, null],
  ['Spectrum Library', null, null, null],
  ['Vidyadhan Study Room', null, null, null],
  ['UPSC Academia Reading Room', null, null, null],
  ['Sanskruti Abhyasika', null, null, null],
  ['Prime Study Room', null, null, null],
  ['Study House Library Abhyasika', null, null, null],

  ['Study Hub', '7083777186', null, 'LBS Road, Navi Peth'],
  ['Vidyarjan Abhyasika', '8668222706', null, 'Kesariwada, Narayan Peth'],
  ['Dnyankranti Abhyasika', '7709376286', null, 'Tilak Road'],
  ['Satyaki Abhyasika', '9112412887', null, 'LBS Road, Navi Peth'],
  ['Setu Abhyasika', '9075048080', null, 'RB Kumthekar Road'],
  ['Rajgruha Abhyasika', '8766473335', null, 'Navi Peth / Dattawadi'],
  ['SADHANA LIBRARY NAVI PETH PUNE', '9370870364', null, 'LBS Road, Navi Peth'],
  ['Study Zone ( Reading Room)', '7066577691', null, 'Navi Peth'],
  ['Dnyansparsh Abhyasika (Reading Hall)', '9421887325', null, 'Dattawadi'],
  ['Poona central abhyasika', '7499934376', null, 'Sane Guruji Marg, Sadashiv Peth'],
  ['SARASWATI ABHYASIKA', null, null, 'Perugate, Sadashiv Peth'],
  ['Shreayas Abhyasika', '9112147180', null, 'Navi Peth'],
  ['KrantiAgrani Abhyasika', null, null, 'Khajina Vihir Chowk'],
  ['Vidyadhan Study room', null, null, 'Narayan Peth'],
  ['Global Library (अभ्यासिका)', '7588959401', null, 'Nimbalkar Talim Chowk'],
  ['Swarajya Global Abhyasika', '7588959401', null, 'Nimbalkar Talim Chowk'],
  ['Swami Samarth Study Room', null, null, 'Limayewadi Road'],
  ['Waari Abhyasika (Reading/ Study Room/ Library)', '9764492349', null, 'Shanipar–Nagnathpar Road'],
  ['Guru Abhyasika', '9404481094', null, 'Perugate'],
  ['Maharashtra Abhyasika', '7798960279', null, 'Laxmi Road'],
  ['Ahilya Shikshan Mandal', null, null, 'Navi Peth–Sadashiv Peth'],
  ['MS Gauri', null, null, 'Sadashiv Peth'],
  ['Eduvision Studyhub', null, null, 'Pune'],
  ['Careers Hub Study Room', null, null, 'Sadashiv Peth'],
  ['Geetanand Reading Room', null, null, 'Apte Road'],
  ["Vinod Reddy's Study Centre", null, null, 'LBS Road'],
  ['Peace Cube Study Room', null, null, 'Sadashiv Peth'],
  ['Sankalp Abhyasika', null, null, 'Sadashiv Peth'],
  ['Shivneri Study', null, null, 'Sadashiv Peth'],
  ['Morya Abhyasika', null, null, 'Sadashiv Peth'],
  ['Satyaki Abhyasika', '9112412887', null, 'LBS Road'],
  ['Study Cubes / StudyRooms.in', null, null, 'Navi Peth–Sadashiv Peth'],
  ['Gyanjyoti Book House & Reading Room', null, null, 'Sadashiv Peth'],
  ['Abhyas Mandal Library', '7507081414', null, 'Sadashiv Peth'],
  ['Desai College Reading Hall', null, null, 'Sadashiv Peth'],
  ['Swami Vivekanand Abhyasika', null, null, 'Sadashiv Peth'],
  ['Vidyadhan Study Room', null, null, 'Narayan Peth'],
  ['Sanskriti Abhyasika', null, null, 'Sadashiv Peth'],
  ['Prime Study Room', null, null, 'Sadashiv Peth'],
  ['Gyanjyoti Abhyasika', '9307598729', null, 'RB Kumthekar Road'],
  ['Dhyas Abhyasika', null, null, 'Vishrambag Wada Road'],
  ['Pradnya Abhyasika', '9225343561', null, 'RB Kumthekar Road'],
  ['The Savali Abhyasika – Branch 2', '9890687074', null, 'Perugate'],
  ['Rajvishwa Abhyasika', '8055964545', null, 'Deshmukh Wadi'],
  ['Ahilya Library / Reading Room', '9850163210', null, 'LBS Road'],
  ['Lokseva Abhyasika', '9970059999', null, 'Tilak Road'],
  ['Race Library Abhyasika', '7020009042', null, 'Pantancha Gate'],
  ['New Savitri Library & Reading Room', '9527360321', null, 'Laxmi Road / Narayan Peth'],
  ['Success Study Point', '9075969749', null, 'Perugate'],
  ['Wisdom Abhyasika', '7588882999', null, 'LBS Road / Navi Peth'],
];

async function generateUniqueSlug(client, base) {
  const root = slugify(base) || 'library';
  let slug = root;
  let attempt = 0;
  while (true) {
    const { rows } = await client.query('SELECT 1 FROM libraries WHERE slug = $1', [slug]);
    if (rows.length === 0) return slug;
    attempt += 1;
    slug = `${root}-${attempt + 1}`;
  }
}

async function run() {
  const passwordHash = await bcrypt.hash(PLACEHOLDER_PASSWORD, 12);
  let created = 0;

  for (let i = 0; i < ENTRIES.length; i += 1) {
    const [name, phone, email, area] = ENTRIES[i];
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ownerEmail = `directory+${i + 1}@labflow.local`;
      const ownerMobile = String(6000000001 + i);

      const { rows: userRows } = await client.query(
        `INSERT INTO users (name, email, mobile, password_hash, role)
         VALUES ($1, $2, $3, $4, 'LIBRARY_OWNER')
         RETURNING id`,
        [name, ownerEmail, ownerMobile, passwordHash]
      );
      const ownerId = userRows[0].id;

      const slug = await generateUniqueSlug(client, name);

      await client.query(
        `INSERT INTO libraries (owner_id, name, slug, email, mobile, city, area, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PUBLISHED')`,
        [ownerId, name, slug, email, phone, 'Pune', area]
      );

      await client.query('COMMIT');
      created += 1;
      console.log(`created: ${name} -> /l/${slug}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`failed: ${name}`, err.message);
    } finally {
      client.release();
    }
  }

  console.log(`\nDone. Created ${created} / ${ENTRIES.length} libraries.`);
  await pool.end();
}

run();

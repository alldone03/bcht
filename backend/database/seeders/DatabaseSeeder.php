<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Team;
use App\Models\User;
use App\Models\Form;
use App\Models\Question;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles
        $rolesData = [
            ['name' => 'ADMIN', 'display_name' => 'Admin'],
            ['name' => 'DOKTER', 'display_name' => 'Dokter'],
            ['name' => 'PESERTA', 'display_name' => 'Peserta'],
            ['name' => 'TIM_KESEHATAN', 'display_name' => 'Tim Kesehatan'],
            ['name' => 'PENANGGUNG_JAWAB_TIM', 'display_name' => 'Penanggung Jawab Tim'],
            ['name' => 'PETUGAS_KESEHATAN', 'display_name' => 'Petugas Kesehatan'],
            ['name' => 'TEMAN_PENDAMPING', 'display_name' => 'Teman Pendamping'],
        ];

        foreach ($rolesData as $role) {
            Role::updateOrCreate(['name' => $role['name']], $role);
        }

        // 2. Seed Permissions
        $permissionsData = [
            ['name' => 'create_form', 'display_name' => 'Create Form'],
            ['name' => 'edit_form', 'display_name' => 'Edit Form'],
            ['name' => 'view_all_responses', 'display_name' => 'View All Responses'],
            ['name' => 'view_team_responses', 'display_name' => 'View Team Responses'],
            ['name' => 'submit_response', 'display_name' => 'Submit Response'],
            ['name' => 'write_diagnosis', 'display_name' => 'Write Diagnosis'],
        ];

        foreach ($permissionsData as $perm) {
            Permission::updateOrCreate(['name' => $perm['name']], $perm);
        }

        // 3. Map Permissions to Roles
        $admin = Role::where('name', 'ADMIN')->first();
        $dokter = Role::where('name', 'DOKTER')->first();
        $peserta = Role::where('name', 'PESERTA')->first();
        $timKes = Role::where('name', 'TIM_KESEHATAN')->first();
        $pjTim = Role::where('name', 'PENANGGUNG_JAWAB_TIM')->first();
        $petugasKes = Role::where('name', 'PETUGAS_KESEHATAN')->first();
        $temanPendamping = Role::where('name', 'TEMAN_PENDAMPING')->first();

        $allPermIds = Permission::pluck('id')->toArray();
        $admin->permissions()->sync($allPermIds);

        $dokterPerms = Permission::whereIn('name', ['create_form', 'edit_form', 'view_all_responses', 'submit_response', 'write_diagnosis'])->pluck('id')->toArray();
        $dokter->permissions()->sync($dokterPerms);

        $pesertaPerms = Permission::whereIn('name', ['submit_response'])->pluck('id')->toArray();
        $peserta->permissions()->sync($pesertaPerms);

        $timKesPerms = Permission::whereIn('name', ['view_all_responses', 'write_diagnosis'])->pluck('id')->toArray();
        $timKes->permissions()->sync($timKesPerms);
        $petugasKes->permissions()->sync($timKesPerms);

        $pjTimPerms = Permission::whereIn('name', ['view_team_responses', 'submit_response'])->pluck('id')->toArray();
        $pjTim->permissions()->sync($pjTimPerms);

        $temanPendamping->permissions()->sync($pesertaPerms);

        // 4. Seed Teams
        $team1 = Team::updateOrCreate(['name' => 'Tim Merah Putih'], ['location' => 'Posko A - Gunung Kidul']);
        $team2 = Team::updateOrCreate(['name' => 'Tim Garuda'], ['location' => 'Posko B - Merapi']);

        // 5. Seed Users with proper roles & teams
        $usersData = [
            [
                'name' => 'Admin Patriot',
                'email' => 'admin@patriot.com',
                'password' => Hash::make('password'),
                'role_id' => $admin->id,
                'team_id' => null,
            ],
            [
                'name' => 'Dr. Jane Smith',
                'email' => 'dokter@patriot.com',
                'password' => Hash::make('password'),
                'role_id' => $dokter->id,
                'team_id' => null,
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'peserta@patriot.com',
                'password' => Hash::make('password'),
                'role_id' => $peserta->id,
                'team_id' => $team1->id,
            ],
            [
                'name' => 'Ani Lestari',
                'email' => 'ani@patriot.com',
                'password' => Hash::make('password'),
                'role_id' => $peserta->id,
                'team_id' => $team1->id, // Same team, makes her a potential companion for Budi
            ],
            [
                'name' => 'Yusuf Mansur',
                'email' => 'yusuf@patriot.com',
                'password' => Hash::make('password'),
                'role_id' => $pjTim->id,
                'team_id' => $team1->id,
            ],
        ];

        foreach ($usersData as $userData) {
            User::updateOrCreate(['email' => $userData['email']], $userData);
        }

        // 6. Seed Forms (Form 1 to Form 6)
        $this->seedForms();
    }

    private function seedForms(): void
    {
        $dokterUser = User::whereHas('role', function($q) { $q->where('name', 'DOKTER'); })->first();
        $createdById = $dokterUser ? $dokterUser->id : null;

        // FORM 1: Profil Awal
        $form1 = Form::updateOrCreate(
            ['title' => 'Form 1 — Profil Awal'],
            [
                'description' => 'Diisi satu kali, idealnya 4–6 minggu sebelum keberangkatan. Jawaban medis hanya dilihat oleh petugas yang berwenang.',
                'frequency' => 'ONCE',
                'target_audience' => ['PESERTA', 'TIM_KESEHATAN'],
                'created_by' => $createdById
            ]
        );

        $form1Questions = [
            [
                'question_code' => 'A01',
                'text' => 'Nama lengkap atau ID peserta',
                'type' => 'text',
                'options' => null,
                'order_number' => 1,
            ],
            [
                'question_code' => 'A02',
                'text' => 'Tanggal lahir dan usia (Format: Tgl Lahir; Usia)',
                'type' => 'text',
                'options' => null,
                'order_number' => 2,
            ],
            [
                'question_code' => 'A05',
                'text' => 'Aktivitas lapangan yang akan dilakukan (boleh lebih dari satu)',
                'type' => 'checkbox',
                'options' => ['Berjalan jauh/trekking', 'Mengemudi', 'Naik perahu/aktivitas air', 'Kerja di panas', 'Kerja malam', 'Daerah pegunungan', 'Hutan/kebun', 'Gua/tambang', 'Kontak hewan', 'Kontak masyarakat/pelayanan'],
                'order_number' => 3,
            ],
            [
                'question_code' => 'A08',
                'text' => 'Apakah Anda mempunyai alergi berat atau pernah mengalami anafilaksis?',
                'type' => 'radio',
                'options' => ['Tidak', 'Ya', 'Tidak yakin'],
                'order_number' => 4,
                'trigger_action_text' => 'Catat pemicu, tanda awal, dan obat yang diresepkan'
            ],
            [
                'question_code' => 'A09',
                'text' => 'Bila menjawab \'Ya\', apa pemicu alerginya dan obat darurat apa yang diresepkan?',
                'type' => 'text',
                'options' => null,
                'order_number' => 5,
                'trigger_condition' => ['depends_on' => 'A08', 'value' => 'Ya'],
                'trigger_action_text' => 'Simpan rencana bersama peserta dan teman pendamping'
            ],
        ];

        foreach ($form1Questions as $q) {
            Question::updateOrCreate(
                ['form_id' => $form1->id, 'question_code' => $q['question_code']],
                $q
            );
        }

        // FORM 2: Konfirmasi Pra-Keberangkatan
        $form2 = Form::updateOrCreate(
            ['title' => 'Form 2 — Konfirmasi Pra-Keberangkatan'],
            [
                'description' => 'Diisi 24–72 jam sebelum keberangkatan.',
                'frequency' => 'ONCE',
                'target_audience' => ['PESERTA'],
                'created_by' => $createdById
            ]
        );

        $form2Questions = [
            [
                'question_code' => 'B01',
                'text' => 'Dalam 72 jam terakhir, apakah muncul keluhan baru?',
                'type' => 'checkbox',
                'options' => ['Tidak ada', 'Demam/meriang', 'Batuk/sakit tenggorokan', 'Sesak', 'Diare', 'Muntah', 'Nyeri perut', 'Ruam', 'Cedera'],
                'order_number' => 1,
                'trigger_action_text' => 'Buka modul keluhan dan minta penilaian sebelum berangkat'
            ],
            [
                'question_code' => 'B02',
                'text' => 'Apakah seluruh obat rutin, alat kesehatan, dan persediaan cadangan sudah dibawa?',
                'type' => 'radio',
                'options' => ['Ya', 'Tidak', 'Tidak berlaku'],
                'order_number' => 2,
                'trigger_action_text' => 'Lengkapi sebelum berangkat'
            ],
        ];

        foreach ($form2Questions as $q) {
            Question::updateOrCreate(
                ['form_id' => $form2->id, 'question_code' => $q['question_code']],
                $q
            );
        }

        // FORM 3: Check-in Harian
        $form3 = Form::updateOrCreate(
            ['title' => 'Form 3 — Check-in Harian'],
            [
                'description' => 'Diisi sebelum tugas dan diulang bila kondisi berubah. Bagian emosi, rasa aman, dan keselamatan diri hanya dilihat petugas kesehatan/perlindungan peserta.',
                'frequency' => 'DAILY',
                'target_audience' => ['PESERTA', 'TEMAN_PENDAMPING'],
                'created_by' => $createdById
            ]
        );

        $form3Questions = [
            [
                'question_code' => 'H01',
                'text' => 'Apakah Anda atau teman di dekat Anda sedang mengalami tanda bahaya sekarang? (sulit bernapas, nyeri dada, kejang, dll)',
                'type' => 'radio',
                'options' => ['Tidak', 'Ya', 'Tidak yakin'],
                'order_number' => 1,
                'trigger_action_text' => 'HENTIKAN KEGIATAN • JANGAN SENDIRIAN • AKTIFKAN EVAKUASI'
            ],
            [
                'question_code' => 'H02',
                'text' => 'Bagaimana kemampuan Anda menjalankan tugas hari ini dengan aman?',
                'type' => 'radio',
                'options' => ['Seperti biasa', 'Hanya mampu tugas ringan', 'Tidak mampu bertugas', 'Belum yakin—ingin dinilai petugas'],
                'order_number' => 2,
            ],
            [
                'question_code' => 'H03',
                'text' => 'Seince check-in terakhir, apakah ada keluhan baru atau keluhan yang memburuk?',
                'type' => 'radio',
                'options' => ['Tidak', 'Ya'],
                'order_number' => 3,
            ],
            [
                'question_code' => 'H03A',
                'text' => 'Jika menjawab Ya pada nomor H03, keluhan apa yang Anda rasakan?',
                'type' => 'checkbox',
                'options' => ['Demam, meriang, atau menggigil', 'Batuk, sakit tenggorokan, atau sesak', 'Diare, muntah, atau nyeri perut', 'Sakit kepala baru atau berat', 'Sangat haus, pusing, kram, atau lemas', 'Ruam', 'Perdarahan tidak biasa', 'Luka memburuk', 'Nyeri yang mengganggu aktivitas', 'Keluhan lain'],
                'order_number' => 4,
                'trigger_condition' => ['depends_on' => 'H03', 'value' => 'Ya'],
                'trigger_action_text' => 'Lanjutkan mengisi Form 4 (Keluhan Khusus) setelah check-in ini.'
            ],
            [
                'question_code' => 'H10',
                'text' => 'Sejak check-in terakhir, apakah muncul pikiran untuk menyakiti diri sendiri atau bunuh diri?',
                'type' => 'radio',
                'options' => ['Tidak', 'Ya, tetapi tidak sekarang', 'Ya, sekarang', 'Saya ingin membicarakannya langsung'],
                'order_number' => 5,
            ],
            [
                'question_code' => 'HB1',
                'text' => 'Laporan Teman: Apakah Anda khawatir seorang teman sedang dalam bahaya atau tidak mampu bekerja dengan aman?',
                'type' => 'radio',
                'options' => ['Tidak', 'Ya', 'Tidak yakin'],
                'order_number' => 6,
            ],
        ];

        foreach ($form3Questions as $q) {
            Question::updateOrCreate(
                ['form_id' => $form3->id, 'question_code' => $q['question_code']],
                $q
            );
        }

        // FORM 4: Keluhan atau Kejadian Khusus
        $form4 = Form::updateOrCreate(
            ['title' => 'Form 4 — Keluhan atau Kejadian Khusus'],
            [
                'description' => 'Isi hanya bagian yang sesuai dengan gejala atau kejadian yang Anda alami.',
                'frequency' => 'CONDITIONAL',
                'target_audience' => ['PESERTA', 'TIM_KESEHATAN'],
                'created_by' => $createdById
            ]
        );

        $form4Questions = [
            [
                'question_code' => 'K01',
                'text' => 'Demam: berapa suhu tertinggi yang terukur?',
                'type' => 'radio',
                'options' => ['Normal (< 37.5°C)', '37.5°C - 38.4°C', '>= 38.5°C', 'Tidak sempat mengukur tetapi merasa demam'],
                'order_number' => 1,
            ],
            [
                'question_code' => 'K03',
                'text' => 'Demam: apakah ada nyeri perut berat, muntah berulang, perdarahan, sangat lemas, atau sesak?',
                'type' => 'checkbox',
                'options' => ['Tidak ada', 'Nyeri perut berat', 'Muntah berulang', 'Perdarahan', 'Sangat lemas/mengantuk/gelisah', 'Sesak', 'Kencing sangat sedikit'],
                'order_number' => 2,
                'trigger_action_text' => 'DARURAT/PERIKSA SEGERA'
            ],
        ];

        foreach ($form4Questions as $q) {
            Question::updateOrCreate(
                ['form_id' => $form4->id, 'question_code' => $q['question_code']],
                $q
            );
        }

        // FORM 5: Kesehatan Jiwa (DASS-21)
        $form5 = Form::updateOrCreate(
            ['title' => 'Form 5 — Kesehatan Jiwa (DASS-21)'],
            [
                'description' => 'DASS-21 dan Pertanyaan Keselamatan. Diisi setiap dua minggu sekali.',
                'frequency' => 'BI_WEEKLY',
                'target_audience' => ['PESERTA'],
                'created_by' => $createdById
            ]
        );

        $form5Questions = [
            [
                'question_code' => 'D01',
                'text' => 'Saya merasa sulit untuk beristirahat.',
                'type' => 'scale',
                'options' => ['0 - Tidak sesuai sama sekali', '1 - Kadang-kadang sesuai', '2 - Lumayan sering sesuai', '3 - Sangat sesuai / sering sekali'],
                'order_number' => 1,
            ],
            [
                'question_code' => 'D03',
                'text' => 'Saya sama sekali tidak dapat merasakan perasaan positif.',
                'type' => 'scale',
                'options' => ['0 - Tidak sesuai sama sekali', '1 - Kadang-kadang sesuai', '2 - Lumayan sering sesuai', '3 - Sangat sesuai / sering sekali'],
                'order_number' => 2,
            ],
            [
                'question_code' => 'D05',
                'text' => 'Saya merasa sulit untuk meningkatkan inisiatif dalam melakukan sesuatu.',
                'type' => 'scale',
                'options' => ['0 - Tidak sesuai sama sekali', '1 - Kadang-kadang sesuai', '2 - Lumayan sering sesuai', '3 - Sangat sesuai / sering sekali'],
                'order_number' => 3,
            ],
            [
                'question_code' => 'D10',
                'text' => 'Saya merasa tidak ada hal yang dapat diharapkan di masa depan.',
                'type' => 'scale',
                'options' => ['0 - Tidak sesuai sama sekali', '1 - Kadang-kadang sesuai', '2 - Lumayan sering sesuai', '3 - Sangat sesuai / sering sekali'],
                'order_number' => 4,
            ],
        ];

        foreach ($form5Questions as $q) {
            Question::updateOrCreate(
                ['form_id' => $form5->id, 'question_code' => $q['question_code']],
                $q
            );
        }

        // FORM 6: Audit Mingguan Tim/Posko
        $form6 = Form::updateOrCreate(
            ['title' => 'Form 6 — Audit Mingguan Tim/Posko'],
            [
                'description' => 'Diisi oleh penanggung jawab tim setiap minggu dan setiap kali berpindah lokasi.',
                'frequency' => 'WEEKLY',
                'target_audience' => ['PENANGGUNG_JAWAB_TIM'],
                'created_by' => $createdById
            ]
        );

        $form6Questions = [
            [
                'question_code' => 'P01',
                'text' => 'Air minum: sumber, pengolahan, dan wadah penyimpanan sudah aman',
                'type' => 'radio',
                'options' => ['Ya', 'Belum', 'Tidak tahu'],
                'order_number' => 1,
                'trigger_action_text' => 'Perbaiki sebelum dipakai'
            ],
            [
                'question_code' => 'P02',
                'text' => 'Sabun, tempat cuci tangan, jamban, serta pengelolaan sampah/limbah tersedia dan berfungsi',
                'type' => 'radio',
                'options' => ['Ya', 'Belum', 'Tidak tahu'],
                'order_number' => 2,
                'trigger_action_text' => 'Tunjuk penanggung jawab dan perbaiki'
            ],
        ];

        foreach ($form6Questions as $q) {
            Question::updateOrCreate(
                ['form_id' => $form6->id, 'question_code' => $q['question_code']],
                $q
            );
        }
    }
}

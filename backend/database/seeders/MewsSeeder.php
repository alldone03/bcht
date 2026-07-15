<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Services\MewsScreeningService;

class MewsSeeder extends Seeder
{
    protected MewsScreeningService $service;

    public function __construct(MewsScreeningService $service)
    {
        $this->service = $service;
    }

    public function run(): void
    {
        // Check if M-EWS template already exists
        if (\Illuminate\Support\Facades\DB::table('mews_templates')->where('name', 'Modified Early Warning Score (M-EWS)')->exists()) {
            return;
        }

        // 1. Create Template
        $template = $this->service->createTemplate([
            'name' => 'Modified Early Warning Score (M-EWS)',
            'description' => 'Sistem deteksi dini parameter klinis (Kesadaran, Pernapasan, Nadi, Suhu, Kemampuan Fisik) untuk mengidentifikasi tingkat urgensi evakuasi atau penanganan medis.',
        ]);

        // 2. Parameters & Questions & Answers Data
        $data = [
            [
                'parameter' => 'Kesadaran',
                'order_number' => 1,
                'question' => 'Bagaimana kondisi kesadaran pasien?',
                'answers' => [
                    ['answer' => 'Sadar penuh', 'score' => 0, 'severity_color' => 'GREEN'],
                    ['answer' => 'Mengantuk / Bingung', 'score' => 1, 'severity_color' => 'YELLOW'],
                    ['answer' => 'Tidak sadar / Kejang', 'score' => 2, 'severity_color' => 'RED'],
                ]
            ],
            [
                'parameter' => 'Pernapasan',
                'order_number' => 2,
                'question' => 'Bagaimana laju pernapasan pasien per menit?',
                'answers' => [
                    ['answer' => 'Normal (12 - 20 kali/menit)', 'score' => 0, 'severity_color' => 'GREEN'],
                    ['answer' => 'Sedikit cepat/lambat (9-11 atau 21-24 kali/menit)', 'score' => 1, 'severity_color' => 'YELLOW'],
                    ['answer' => 'Sangat cepat/lambat (<9 atau >24 kali/menit)', 'score' => 2, 'severity_color' => 'RED'],
                ]
            ],
            [
                'parameter' => 'Nadi',
                'order_number' => 3,
                'question' => 'Berapa denyut nadi pasien per menit?',
                'answers' => [
                    ['answer' => 'Normal (51 - 100 kali/menit)', 'score' => 0, 'severity_color' => 'GREEN'],
                    ['answer' => 'Sedikit cepat/lambat (41-50 atau 101-110 kali/menit)', 'score' => 1, 'severity_color' => 'YELLOW'],
                    ['answer' => 'Sangat cepat/lambat (<41 atau >110 kali/menit)', 'score' => 2, 'severity_color' => 'RED'],
                ]
            ],
            [
                'parameter' => 'Suhu',
                'order_number' => 4,
                'question' => 'Berapa suhu tubuh pasien (Celcius)?',
                'answers' => [
                    ['answer' => 'Normal (36.0°C - 37.9°C)', 'score' => 0, 'severity_color' => 'GREEN'],
                    ['answer' => 'Subfebris/Hipotermia ringan (35.0°C-35.9°C atau 38.0°C-38.9°C)', 'score' => 1, 'severity_color' => 'YELLOW'],
                    ['answer' => 'Hipertermia/Hipotermia berat (<35.0°C atau >38.9°C)', 'score' => 2, 'severity_color' => 'RED'],
                ]
            ],
            [
                'parameter' => 'Kemampuan Fisik',
                'order_number' => 5,
                'question' => 'Bagaimana kemampuan fisik/mobilisasi pasien?',
                'answers' => [
                    ['answer' => 'Mandiri / Aktivitas normal', 'score' => 0, 'severity_color' => 'GREEN'],
                    ['answer' => 'Butuh bantuan minimal / Kelemahan ringan', 'score' => 1, 'severity_color' => 'YELLOW'],
                    ['answer' => 'Imobilisasi / Lumpuh / Butuh bantuan penuh', 'score' => 2, 'severity_color' => 'RED'],
                ]
            ]
        ];

        // Seed parameters, questions, answers using the MewsScreeningService
        foreach ($data as $item) {
            $parameter = $this->service->createParameter([
                'template_id' => $template->id,
                'name' => $item['parameter'],
                'order_number' => $item['order_number'],
            ]);

            $question = $this->service->createQuestion([
                'parameter_id' => $parameter->id,
                'question' => $item['question'],
            ]);

            foreach ($item['answers'] as $ans) {
                $this->service->createAnswer([
                    'question_id' => $question->id,
                    'answer' => $ans['answer'],
                    'score' => $ans['score'],
                    'severity_color' => $ans['severity_color'],
                ]);
            }
        }
    }
}

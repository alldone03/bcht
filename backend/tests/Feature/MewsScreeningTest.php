<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ScreeningTemplate;
use App\Models\ScreeningQuestion;
use App\Models\ScreeningAnswer;
use App\Models\ScreeningSession;
use App\Services\MewsScreeningService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MewsScreeningTest extends TestCase
{
    use RefreshDatabase;

    protected MewsScreeningService $service;
    protected User $user;
    protected ScreeningTemplate $template;

    protected function setUp(): void
    {
        parent::setUp();

        // Instantiate service
        $this->service = $this->app->make(MewsScreeningService::class);

        // Run seeders
        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        // Get seeded template & user
        $this->template = ScreeningTemplate::first();
        $this->user = User::where('role', 'PESERTA')->first();
    }

    /**
     * Helper to retrieve answer ID by parameter name and choice index (0, 1, or 2)
     */
    protected function getAnswerId(string $parameterName, int $score): int
    {
        $template = ScreeningTemplate::with(['parameters.question.answers'])->first();
        $param = $template->parameters->where('name', $parameterName)->first();
        $answer = $param->question->answers->where('score', $score)->first();
        return $answer->id;
    }

    /**
     * Helper to run a test case with scores array
     */
    protected function runScreeningTestCase(array $scores): array
    {
        // 1. Start Session
        $session = $this->service->startScreening($this->user->id, $this->template->id);

        // 2. Submit answers
        $parameters = ['Kesadaran', 'Pernapasan', 'Nadi', 'Suhu', 'Kemampuan Fisik'];
        foreach ($parameters as $index => $paramName) {
            $score = $scores[$index];
            $questionId = $this->template->parameters[$index]->question->id;
            $answerId = $this->getAnswerId($paramName, $score);

            $this->service->submitAnswer($session->id, $questionId, $answerId);
        }

        // 3. Calculate and Save result
        $calculated = $this->service->calculateResult($session->id);
        $this->service->saveResult($session->id, $calculated);

        // 4. Return result
        return $this->service->getResult($session->id);
    }

    public function test_case_1_all_zeros_is_green()
    {
        // Case 1: 0 0 0 0 0 -> GREEN
        $result = $this->runScreeningTestCase([0, 0, 0, 0, 0]);

        $this->assertEquals(0, $result['total_score']);
        $this->assertEquals(0, $result['highest_score']);
        $this->assertEquals('GREEN', $result['classification']);
        $this->assertEquals('Lanjutkan aktivitas normal.', $result['recommendation']);
    }

    public function test_case_2_one_yellow_is_yellow()
    {
        // Case 2: 0 1 0 0 0 -> YELLOW
        $result = $this->runScreeningTestCase([0, 1, 0, 0, 0]);

        $this->assertEquals(1, $result['total_score']);
        $this->assertEquals(1, $result['highest_score']);
        $this->assertEquals('YELLOW', $result['classification']);
        $this->assertEquals('Istirahat, observasi ulang 2-4 jam, konsultasikan apabila memburuk.', $result['recommendation']);
    }

    public function test_case_3_all_yellows_is_yellow()
    {
        // Case 3: 1 1 1 1 1 -> YELLOW
        $result = $this->runScreeningTestCase([1, 1, 1, 1, 1]);

        $this->assertEquals(5, $result['total_score']);
        $this->assertEquals(1, $result['highest_score']);
        $this->assertEquals('YELLOW', $result['classification']);
        $this->assertEquals('Istirahat, observasi ulang 2-4 jam, konsultasikan apabila memburuk.', $result['recommendation']);
    }

    public function test_case_4_one_red_is_red()
    {
        // Case 4: 0 2 0 0 0 -> RED
        $result = $this->runScreeningTestCase([0, 2, 0, 0, 0]);

        $this->assertEquals(2, $result['total_score']);
        $this->assertEquals(2, $result['highest_score']);
        $this->assertEquals('RED', $result['classification']);
        $this->assertEquals('Segera lakukan evakuasi medis.', $result['recommendation']);
    }

    public function test_case_5_all_reds_is_red()
    {
        // Case 5: 2 2 2 2 2 -> RED
        $result = $this->runScreeningTestCase([2, 2, 2, 2, 2]);

        $this->assertEquals(10, $result['total_score']);
        $this->assertEquals(2, $result['highest_score']);
        $this->assertEquals('RED', $result['classification']);
        $this->assertEquals('Segera lakukan evakuasi medis.', $result['recommendation']);
    }
}

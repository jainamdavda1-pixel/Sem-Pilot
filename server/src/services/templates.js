/**
 * Centralized responsive HTML email templates matching SemPilot branding
 */

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SemPilot Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F8FAFC;
      padding: 24px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px border #E2E8F0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
    }
    .header {
      background-color: #4F46E5;
      background-image: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      padding: 32px 24px;
      text-align: center;
      color: #FFFFFF;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .header p {
      margin: 4px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
      font-weight: 500;
    }
    .content {
      padding: 32px 24px;
    }
    .btn {
      display: inline-block;
      background-color: #4F46E5;
      color: #FFFFFF !important;
      padding: 12px 24px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 8px;
      margin-top: 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      margin-left: 8px;
    }
    .badge-urgent { background-color: #FEE2E2; color: #991B1B; }
    .badge-high { background-color: #FEF3C7; color: #92400E; }
    .badge-normal { background-color: #DBEAFE; color: #1E40AF; }
    .footer {
      background-color: #F1F5F9;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      border-top: 1px solid #E2E8F0;
    }
    .footer a {
      color: #64748B;
      text-decoration: underline;
    }
    .table-container {
      margin-top: 16px;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background-color: #F8FAFC;
      font-weight: 700;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid #E2E8F0;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #F1F5F9;
    }
    .text-green { color: #10B981; font-weight: 700; }
    .text-red { color: #EF4444; font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${content}
      <div class="footer">
        <p>This is an automated notification from <strong>SemPilot Academic Planner</strong>.</p>
        <p>You can adjust your notifications and email summaries in your settings preference panel.</p>
        <p>© 2026 SemPilot. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const templates = {
  // 1. Assignment Reminder
  assignmentReminder: (data) => baseTemplate(`
    <div class="header">
      <h1>Assignment Deadline Reminder</h1>
      <p>Stay on track with your submissions</p>
    </div>
    <div class="content">
      <h3 style="margin-top: 0;">Hi Student,</h3>
      <p>An assignment or coursework task is approaching its due date:</p>
      
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <div style="font-size: 10px; font-weight: 700; color: #64748B; uppercase; tracking-wider;">${data.subjectCode} • ${data.subjectName}</div>
        <div style="font-size: 16px; font-weight: 700; color: #1E293B; margin-top: 4px;">
          ${data.title}
          <span class="badge badge-${data.priority?.toLowerCase() === "urgent" ? "urgent" : data.priority?.toLowerCase() === "high" ? "high" : "normal"}">
            ${data.priority}
          </span>
        </div>
        <p style="font-size: 12px; color: #475569; margin: 12px 0 0 0; line-height: 1.5;">${data.description || "No specific instructions specified."}</p>
        <div style="margin-top: 16px; font-size: 12px; font-weight: 600; color: #4F46E5;">
          📅 Due Date: ${data.dueDate} ${data.dueTime || ""}
        </div>
      </div>
      
      <a href="https://semesterpilot.vercel.app/assignments" class="btn">View Assignments Dashboard</a>
    </div>
  `),

  // 2. Weekly Attendance Report
  weeklyAttendanceReport: (data) => baseTemplate(`
    <div class="header">
      <h1>Weekly Attendance Status</h1>
      <p>Review your attendance margins and margins safety</p>
    </div>
    <div class="content">
      <h3 style="margin-top: 0;">Hi Student,</h3>
      <p>Here is your weekly summary report for target requirements of <strong>${data.targetGoal}%</strong>:</p>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Conducted</th>
              <th>Attendance Rate</th>
              <th>Status Margin</th>
            </tr>
          </thead>
          <tbody>
            ${data.subjects.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.total} sessions</td>
                <td class="${s.rate >= data.targetGoal ? "text-green" : "text-red"}">${s.rate}%</td>
                <td>${s.margin}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      ${data.warningCount > 0 ? `
        <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; padding: 14px; border-radius: 8px; margin-top: 20px; font-size: 12px; font-weight: 600;">
          ⚠️ You currently have ${data.warningCount} subjects falling below the required ${data.targetGoal}% attendance requirement!
        </div>
      ` : ""}

      <a href="https://semesterpilot.vercel.app/" class="btn">Go to Dashboard</a>
    </div>
  `),

  // 3. Monthly Performance Report
  monthlyPerformanceReport: (data) => baseTemplate(`
    <div class="header">
      <h1>Monthly Performance Report</h1>
      <p>Projections, trends, and achievements</p>
    </div>
    <div class="content">
      <h3 style="margin-top: 0;">Hi Student,</h3>
      <p>Here is your academic progress check for the past month:</p>

      <div style="display: flex; gap: 16px; margin: 20px 0;">
        <div style="flex: 1; text-align: center; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; background-color: #FAF5FF;">
          <span style="font-size: 10px; font-weight: 700; color: #7C3AED; uppercase; tracking-wider; block">Overall Rate</span>
          <span style="display: block; font-size: 28px; font-weight: 800; color: #7C3AED; margin-top: 6px;">${data.overallRate}%</span>
        </div>
        <div style="flex: 1; text-align: center; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; background-color: #ECFDF5;">
          <span style="font-size: 10px; font-weight: 700; color: #059669; uppercase; tracking-wider; block">Tasks Completed</span>
          <span style="display: block; font-size: 28px; font-weight: 800; color: #059669; margin-top: 6px;">${data.completedCount}</span>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Classes Conducted</th>
              <th>Attendance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.subjects.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.total}</td>
                <td class="${s.rate >= data.target ? "text-green" : "text-red"}">${s.rate}%</td>
                <td>${s.rate >= data.target ? "Healthy" : "Critical"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <a href="https://semesterpilot.vercel.app/analytics" class="btn">View Analytics Hub</a>
    </div>
  `),

  // 4. Exam Reminder
  examReminder: (data) => baseTemplate(`
    <div class="header">
      <h1>Upcoming Exams Reminder</h1>
      <p>Prepare for your academic evaluations</p>
    </div>
    <div class="content">
      <h3 style="margin-top: 0;">Hi Student,</h3>
      <p>The academic evaluations are approaching rapidly. Make sure to prepare:</p>

      <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 16px; border-radius: 12px; margin: 20px 0; color: #92400E; font-size: 13px; font-weight: 700;">
        ⏳ ${data.examName} is scheduled to start in ${data.daysRemaining} days (on ${data.examDate})!
      </div>

      <p>Subjects list included in this term:</p>
      <ul style="padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.6;">
        ${data.subjects.map(s => `<li><strong>${s.code} - ${s.name}</strong> (Credits: ${s.credits})</li>`).join("")}
      </ul>

      <a href="https://semesterpilot.vercel.app/calendar" class="btn">Open Academic Calendar</a>
    </div>
  `),

  // 5. AI Weekly Summary
  aiWeeklySummary: (data) => baseTemplate(`
    <div class="header">
      <h1>AI Weekly Summary</h1>
      <p>Your custom study plan & feedback by SemPilot AI</p>
    </div>
    <div class="content">
      <h3 style="margin-top: 0;">Hi Student,</h3>
      <p>Here is your personalized academic coaching digest generated by SemPilot Copilot:</p>

      <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left; font-size: 13px; line-height: 1.6; color: #3730A3;">
        <strong>🤖 AI Tutor Message:</strong>
        <p style="margin: 8px 0 0 0; color: #4338CA; white-space: pre-line;">${data.aiSummaryText}</p>
      </div>

      <a href="https://semesterpilot.vercel.app/ai-assistant" class="btn">Ask Copilot Chat</a>
    </div>
  `),

  // 6. College Announcement
  collegeAnnouncement: (data) => baseTemplate(`
    <div class="header">
      <h1>Notice Board Announcement</h1>
      <p>Official notification from your faculties</p>
    </div>
    <div class="content">
      <h3 style="margin-top: 0;">Dear Student,</h3>
      <p>A new official campus announcement has been published:</p>

      <div style="border-left: 4px solid #4F46E5; padding-left: 16px; margin: 20px 0;">
        <div style="font-size: 14px; font-weight: 700; color: #1E293B;">${data.title}</div>
        <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; margin-top: 2px;">Published by: ${data.publisher}</div>
        <p style="font-size: 12px; color: #475569; margin-top: 8px; line-height: 1.6;">${data.message}</p>
      </div>

      <a href="https://semesterpilot.vercel.app/" class="btn">View Notice Board</a>
    </div>
  `)
};

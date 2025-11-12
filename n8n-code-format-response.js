const agentOutput = $input.first().json;
const leadData = $node["חילוץ נתונים"].json;

function createFallbackResponse() {
  return {
    success: true,
    lead: {
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      problem: leadData.problem,
      goal: leadData.goal,
      currentSystem: leadData.currentSystem,
      timestamp: new Date().toISOString()
    },
    result: {
      title: "פתרון אוטומציה מותאם אישית",
      steps: [
        {name: "ניתוח תהליכים עסקיים קיימים", tool: "כלי ניתוח מקצועי"},
        {name: "תכנון הפתרון האוטומטי", tool: "מערכת תכנון"},
        {name: "בניה והטמעה של האוטומציה", tool: "פלטפורמת אוטומציה"},
        {name: "בדיקות ושיפור מתמיד", tool: "מערכת ניטור"}
      ],
      estimatedTime: "שבוע עד שבועיים",
      valueProposition: "פתרון מותאם במיוחד לצרכים העסקיים שלכם, חוסך זמן ומשפר יעילות",
      timeSaving: "חיסכון של שעות עבודה ידניות בכל שבוע",
      efficiencyGain: "שיפור משמעותי בזמני תגובה ודיוק"
    }
  };
}

try {
  let aiText = agentOutput.output || agentOutput.text || agentOutput.response || '';
  
  if (typeof aiText === 'object') {
    aiText = JSON.stringify(aiText);
  }
  
  const jsonMatch = aiText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    aiText = jsonMatch[1];
  }
  
  const aiResult = JSON.parse(aiText);
  
  if (aiResult.valid === false) {
    console.log('AI rejected input as invalid');
    return [{
      json: {
        success: false,
        error: 'INVALID_INPUT',
        message: 'הפרטים שהוזנו אינם מספיקים ליצירת אפיון מדויק',
        action: 'RETRY',
        lead: {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          timestamp: new Date().toISOString()
        }
      }
    }];
  }
  
  const hasGoodData = aiResult.title && aiResult.steps && Array.isArray(aiResult.steps) && aiResult.steps.length > 0 && aiResult.valueProposition;
  
  if (!hasGoodData) {
    console.log('AI response incomplete, using fallback');
    return [{ json: createFallbackResponse() }];
  }
  
  return [{
    json: {
      success: true,
      lead: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        problem: leadData.problem,
        goal: leadData.goal,
        currentSystem: leadData.currentSystem,
        timestamp: new Date().toISOString()
      },
      result: {
        title: aiResult.title,
        steps: aiResult.steps,
        estimatedTime: aiResult.estimatedTime || "שבוע עד שבועיים",
        valueProposition: aiResult.valueProposition,
        timeSaving: aiResult.timeSaving,
        efficiencyGain: aiResult.efficiencyGain
      }
    }
  }];
  
} catch (error) {
  console.log('Error, using fallback:', error.message);
  return [{ json: createFallbackResponse() }];
}



const { poolPromise } = require('../config/db');

exports.submitFeedback = async (req, res) => {
  const { relatedType, relatedId, originalAIOutput, doctorFeedback, correctedOutput } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('RelatedType', relatedType)
      .input('RelatedId', relatedId)
      .input('OriginalAIOutput', originalAIOutput)
      .input('DoctorFeedback', doctorFeedback)
      .input('CorrectedOutput', correctedOutput)
      .input('SubmittedBy', req.user?.id || null)
      .query('INSERT INTO FeedbackTraining (RelatedType, RelatedId, OriginalAIOutput, DoctorFeedback, CorrectedOutput, SubmittedBy) VALUES (@RelatedType,@RelatedId,@OriginalAIOutput,@DoctorFeedback,@CorrectedOutput,@SubmittedBy)');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
};

exports.listFeedback = async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query('SELECT * FROM FeedbackTraining ORDER BY CreatedAt DESC');
    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

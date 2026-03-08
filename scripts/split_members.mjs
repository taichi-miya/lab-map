import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function splitMembers() {
  // 全研究室のfaculty_nameを取得
  const { data: labs, error } = await supabase
    .from('labs')
    .select('id, faculty_name')
    .not('faculty_name', 'is', null)
    .neq('faculty_name', '');

  if (error) {
    console.error('取得エラー:', error);
    return;
  }

  console.log(`対象研究室: ${labs.length}件`);

  const members = [];

  for (const lab of labs) {
    // 「・」で分割
    const names = lab.faculty_name
      .split('・')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    for (const name of names) {
      members.push({
        lab_id: lab.id,
        name: name,
      });
    }
  }

  console.log(`投入予定メンバー数: ${members.length}件`);

  // 100件ずつバッチ投入
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('lab_members')
      .insert(batch);

    if (insertError) {
      console.error(`バッチ${i}エラー:`, insertError);
    } else {
      inserted += batch.length;
      console.log(`進捗: ${inserted}/${members.length}`);
    }
  }

  console.log('完了！');
}

splitMembers();
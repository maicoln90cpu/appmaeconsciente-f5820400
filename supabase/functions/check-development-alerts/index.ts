import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Baby {
  id: string;
  baby_name: string;
  birth_date: string;
  user_id: string;
  user_email?: string;
  development_monitoring_enabled?: boolean;
}

interface AlertSettings {
  alerts_enabled: boolean;
  alert_when_passed_max_age: boolean;
  reminder_frequency_days: number;
  email_enabled: boolean;
  push_enabled: boolean;
}

interface MilestoneType {
  id: string;
  milestone_code: string;
  area: string;
  title: string;
  age_max_months: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Starting development alerts check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all babies with development monitoring enabled
    const { data: babies, error: babiesError } = await supabase
      .from('baby_vaccination_profiles')
      .select(`
        id,
        baby_name,
        birth_date,
        user_id,
        development_monitoring_enabled
      `)
      .eq('development_monitoring_enabled', true);

    if (babiesError) {
      console.error('Error fetching babies:', babiesError);
      throw babiesError;
    }

    console.log(`📊 Found ${babies?.length || 0} babies with monitoring enabled`);

    let alertsSent = 0;

    for (const baby of babies || []) {
      try {
        // Get alert settings for this baby
        const { data: settings } = await supabase
          .from('development_alert_settings')
          .select('*')
          .eq('baby_profile_id', baby.id)
          .single();

        const alertSettings = settings as AlertSettings | null;

        if (!alertSettings?.alerts_enabled) {
          console.log(`⏭️ Alerts disabled for ${baby.baby_name}`);
          continue;
        }

        // Calculate baby age in months
        const birthDate = new Date(baby.birth_date);
        const today = new Date();
        const ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                         (today.getMonth() - birthDate.getMonth());

        console.log(`👶 Checking ${baby.baby_name} (${ageMonths} months old)`);

        // Get milestone types relevant for this age
        const { data: milestoneTypes } = await supabase
          .from('development_milestone_types')
          .select('*')
          .eq('is_active', true)
          .lte('age_max_months', ageMonths);

        // Get existing records
        const { data: records } = await supabase
          .from('baby_milestone_records')
          .select('*')
          .eq('baby_profile_id', baby.id);

        const recordsMap = new Map(
          (records || []).map((r: any) => [r.milestone_type_id, r])
        );

        // Find attention milestones (passed max age + 1 month without record)
        const attentionMilestones = (milestoneTypes || [])
          .filter((mt: MilestoneType) => {
            const record = recordsMap.get(mt.id);
            return ageMonths > mt.age_max_months + 1 && !record?.achieved_date;
          });

        if (attentionMilestones.length > 0) {
          console.log(`⚠️ Found ${attentionMilestones.length} attention milestones for ${baby.baby_name}`);

          // Get user email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', baby.user_id)
            .single();

          if (profile?.email && alertSettings.email_enabled) {
            // Create notification
            const { error: notifError } = await supabase
              .from('user_notifications')
              .insert({
                user_id: baby.user_id,
                notification_id: crypto.randomUUID(),
                is_read: false,
              });

            if (notifError) {
              console.error('Error creating notification:', notifError);
            }

            // Here you would send email via Resend
            // For now, just log
            console.log(`📧 Would send email to ${profile.email} about ${baby.baby_name}`);
            alertsSent++;
          }

          // Update records status to 'attention' if not already done
          for (const milestone of attentionMilestones) {
            const existingRecord = recordsMap.get(milestone.id);
            
            if (!existingRecord) {
              // Create attention record
              await supabase
                .from('baby_milestone_records')
                .insert({
                  user_id: baby.user_id,
                  baby_profile_id: baby.id,
                  milestone_type_id: milestone.id,
                  status: 'attention',
                });
            } else if (existingRecord.status !== 'attention' && !existingRecord.achieved_date) {
              // Update to attention
              await supabase
                .from('baby_milestone_records')
                .update({ status: 'attention' })
                .eq('id', existingRecord.id);
            }
          }
        } else {
          console.log(`✅ No attention milestones for ${baby.baby_name}`);
        }

      } catch (babyError) {
        console.error(`Error processing baby ${baby.baby_name}:`, babyError);
      }
    }

    console.log(`✨ Alerts check complete. ${alertsSent} alerts sent.`);

    return new Response(
      JSON.stringify({
        success: true,
        babies_checked: babies?.length || 0,
        alerts_sent: alertsSent,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in check-development-alerts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

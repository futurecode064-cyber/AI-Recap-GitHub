alter table public.fc_download_events drop constraint fc_download_events_app_key_check;
alter table public.fc_download_events add constraint fc_download_events_app_key_check check (
(event_kind = 'page_view' and app_key is null) or
(event_kind = 'download_click' and app_key in ('ai-studio','app-creator','myanmar-kyar','video-cutter','ai-astrology','el-nino','daily-money','medicine-reminder','kids-learning','safety-guide')));
do $migration$
declare source text; updated text;
begin
select pg_get_functiondef('public.fc_record_download_event(uuid,text,text,uuid)'::regprocedure) into source;
updated := replace(source,'''ai-studio'',''app-creator'',''myanmar-kyar'',''video-cutter'',''ai-astrology'',''el-nino''','''ai-studio'',''app-creator'',''myanmar-kyar'',''video-cutter'',''ai-astrology'',''el-nino'',''daily-money'',''medicine-reminder'',''kids-learning'',''safety-guide''');
if updated = source then raise exception 'Tracker definition changed; review before migration'; end if;
execute updated;
select pg_get_functiondef('public.fc_download_dashboard()'::regprocedure) into source;
updated := replace(source, '(''el-nino'',''အယ်နီညို ကာကွယ်ရေး'')', '(''el-nino'',''အယ်နီညို ကာကွယ်ရေး''),
      (''daily-money'',''Future Code Daily Money''),
      (''medicine-reminder'',''Future Code Medicine Reminder''),
      (''kids-learning'',''Future Code Kids Learning''),
      (''safety-guide'',''Future Code Safety Guide'')');
if updated = source then raise exception 'Dashboard definition changed; review before migration'; end if;
execute updated;
end $migration$;
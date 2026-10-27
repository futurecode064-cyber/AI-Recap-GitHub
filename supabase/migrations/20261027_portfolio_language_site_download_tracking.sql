insert into public.fc_portfolio_apps (site_key, app_key, app_name)
values
  ('english-academy-web', 'english-academy', 'Future Code English Academy APK'),
  ('thai-speaking-web', 'thai-speaking', 'Future Code Thai Speaking APK')
on conflict (site_key, app_key) do update
set app_name = excluded.app_name;

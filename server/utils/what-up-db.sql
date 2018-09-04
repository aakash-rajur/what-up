do $$
begin
  drop table if exists tasks;
  drop table if exists users;

  create table users (
    id      serial primary key,
    hash    text not null unique,
    created timestamp with time zone,
    login   timestamp with time zone
  );

  create table tasks (
    id          serial primary key,
    description text default '',
    status      text default 'CREATED',
    created     timestamp with time zone,
    updated     timestamp with time zone,
    uid         int not null references users (id)
  );
end;
$$;


create or replace function add_user(hash text)
  returns int as $$
declare
  user_now timestamp with time zone := now();
  user_id  int;
begin
  insert into users (hash, created, login) values (hash, user_now, user_now)
      returning id
        into user_id;
  return user_id;
end;
$$
language plpgsql;


create or replace function delete_user(user_hash text)
  returns int as $$
declare
  user_id int;
begin
  user_id := (select id from users where hash = user_hash);

  delete from users where hash = user_hash;
  return user_id;
end;
$$
language plpgsql;


create or replace function add_task(user_hash text, description text)
  returns int as $$
declare
  user_now timestamp with time zone := now();
  task_id  int;
begin
  insert into tasks (description, created, updated, uid)
  values (description, user_now, user_now, (select id from users where user_hash = hash))
      returning id
        into task_id;
  return task_id;
end;
$$
language plpgsql;


create or replace function update_task(task_id int, new_status text)
  returns timestamp with time zone as $$
declare
  user_now timestamp;
begin
  if not (select exists(select 1 from tasks where id = task_id))
  then RAISE EXCEPTION 'NOT_FOUND';
  end if;
  update tasks
  set status  = new_status,
      updated = now()
  where id = task_id
    and status != new_status
      returning updated
        into user_now;
  return user_now;
end;
$$
language plpgsql;


create or replace function edit_task(task_id int, new_description text default '')
  returns timestamp with time zone as $$
declare
  user_now timestamp;
begin
if not (select exists(select 1 from tasks where id = task_id))
  then RAISE EXCEPTION 'NOT_FOUND';
  end if;
  update tasks
  set description = new_description,
      updated     = now()
  where id = task_id returning updated
    into user_now;
  return user_now;
end;
$$
language plpgsql;


create or replace function delete_tasks(user_hash text)
  returns int as $$
declare
  delete_count int := 0;
begin
  with deletions as (delete
      from tasks
      where uid = (select id from users where hash = user_hash)
      returning id)
  select count(id)
  from deletions into delete_count;
  return delete_count;
end;
$$
language plpgsql;


create or replace function get_tasks(user_hash text, task_status text = 'ALL')
  returns table(id int, description text, status text, created timestamp with time zone, updated timestamp with time zone) as $$
begin
  return query select t.id, t.description, t.status, t.created, t.updated
               from tasks t
               where t.uid = (select u.id from users u where u.hash = user_hash)
                       and (task_status = 'ALL'
                  or t.status = task_status)
               order by created desc;
end;
$$
language plpgsql;


create or replace function get_stats(user_hash text)
  returns table(status text, count bigint) as $$
begin
  return query select tasks.status, count(*)
          from tasks
          where uid = (select id from users where hash = user_hash)
          group by tasks.status;
end;
$$
language plpgsql;

create or replace function update_all_tasks(user_hash text, selected text, new_status text)
  returns bigint as $$
declare
  update_count bigint :=0;
  updated_at   timestamp with time zone := now();
begin
  update tasks
  set status  = new_status,
      updated = updated_at
  where uid = (select id from users where hash = user_hash)
    and (selected = 'ALL' or status = selected);
  get diagnostics update_count = row_count;
  return update_count;
end;
$$
language plpgsql;

create or replace function does_user_exist(user_hash text)
  returns boolean as $$
declare
  user_exists boolean := false;
begin
  select exists(select 1 from users where hash = user_hash)
      into user_exists;
  return user_exists;
end;
$$
language plpgsql;
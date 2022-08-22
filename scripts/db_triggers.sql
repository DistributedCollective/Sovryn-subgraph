
create or replace function DeleteMinuteCandles() 
  returns trigger
    LANGUAGE PLPGSQL
    AS
  $$
  BEGIN
  delete
  from "sgd1"."candle_stick_minute"
  where id = NEW.id
  and vid <> NEW.vid;
  RETURN NEW;
  END;
  $$;

  CREATE or replace TRIGGER delete_minute_candles
  AFTER INSERT ON "sgd1"."candle_stick_minute"
  FOR EACH ROW
  EXECUTE PROCEDURE DeleteMinuteCandles();

  create or replace function DeleteDayCandles() 
  returns trigger
  LANGUAGE PLPGSQL
  AS
  $$
  BEGIN
  delete
  from "sgd1"."candle_stick_day"
  where id = NEW.id
  and vid <> NEW.vid;
  RETURN NEW;
  END;
  $$;

  CREATE or replace TRIGGER delete_day_candles
  AFTER INSERT ON "sgd1"."candle_stick_day"
  FOR EACH ROW
  EXECUTE PROCEDURE DeleteDayCandles();
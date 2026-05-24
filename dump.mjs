import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  "https://phvrskjdvhxflllsepmd.supabase.co",
  "sb_publishable_cAAbWV7hHpBNuxRD_3shxQ_2WlS6ZLG"
);

async function checkUsers() {
  const { data, error } = await supabase.from("live_locations").select("*");
  if (error) {
    console.error("Error:", error);
  } else {
    fs.writeFileSync("db_dump.json", JSON.stringify(data, null, 2));
    console.log("Dumped", data.length, "rows to db_dump.json");
  }
}

checkUsers();

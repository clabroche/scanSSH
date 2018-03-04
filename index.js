const Promise = require("bluebird");
const rp = require("request-promise");
const readline = require("readline");
var Client = require("ssh2").Client;

const program = require("commander");
program
  .usage("[options] <path>")
  .option("-u, --username <name>", "username")
  .option("-p, --password <name>", "password")
  .parse(process.argv);
if (!program.username) {
  console.log("Specify an username");
  program.outputHelp();
  process.exit(0);
}
if (!program.password) {
  console.log("Specify a password");
  program.outputHelp();
  process.exit(0);
}
console.log(`Username: ${program.username}   Password: ${program.password}`);

const connections = [];
const ips = [];

for (var i = 0; i < 999; i++) {
  ips.push(`192.168.1.${i}`);
}

Promise.map(
  ips,
  ip => {
    return scan({
      host: ip,
      port: 22,
      username: program.username,
      password: program.password
    });
  },
  { concurrency: 10 }
)
  .filter(item => item !== false)
  .then(data => {
    console.log();
    console.log(`├────> All ips: ${data.join(" - ")}`);

    console.log("Cleaning connections...");
    return connections;
  })
  .map(conn => {
    return conn.end();
  });

function scan(connectObject) {
  return new Promise((resolve, reject) => {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0, null);
    process.stdout.write(`├──> Testing:${connectObject.host}`);

    var conn = new Client();
    connections.push(conn);
    setTimeout(function() {
      resolve(false);
    }, 100);
    conn
      .on("ready", _ => {
        console.log();
        console.log(`├────> Found: ${connectObject.host}`);
        conn.end();
        resolve(connectObject.host);
      })
      .on("error", _ => {
        conn.end();
        resolve(false);
      })
      .connect(connectObject);
  });
}
process.on("exit", _ => {
  console.log("Done, goodbye");
});

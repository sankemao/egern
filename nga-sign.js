const NGA = $persistentStore.read("NGA");
if(!NGA){
   $notification.post("NGA", "未获取cookie, 请先进入签到页面一次"); 
   $done();
}
let parsed;
try{
  parsed = JSON.parse(NGA);
}catch(e){
  $done()
}

const cookie = parsed.cookie;
const contentType = parsed.contentType;
const userAgent = parsed.userAgent;
const body = parsed.body;

!(async () => {
    await checkin();
    const mids = await missions();
    for (const mid of mids) {
      await checkInCountAdd(mid);
    }
  })()
    .catch((e) => console.log(e))
    .finally(() => $done());

function checkin() {
  const newBody = { ...body };
  newBody["__lib"] = "check_in";
  newBody["__act"] = "check_in";
  const promise = new Promise((resolve) => {
    const options = {
      url: "https://ngabbs.com/nuke.php",
      headers: {
        "Content-Type": contentType,
        Cookie: cookie,
        "User-Agent": userAgent,
      },
      body: ObjectToFormData(newBody, contentType),
    };
    $httpClient.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(err, resp);
          $notification.post("NGA", "刮墙失败，详细参见日志", err);
        } else if (resp.status === 200) {
          console.log(data);
          const result = JSON.parse(data);
          if (result.error) {
            $notification.post("NGA", "刮墙失败", result.error.join(";"));
          } else if (result.data) {
            const message = result.data[0];
            const continued = result.data[1].continued;
            const sum = result.data[1].sum;
            $notification.post(
              "NGA",
              message,
              `连续刮墙${continued}天，累计刮墙${sum}天`
            );
          }
        }
      } catch (e) {
        console.log(e, resp);
      } finally {
        resolve();
      }
    });
  });
  return promise;
}

function missions() {
  const promise = new Promise((resolve) => {
    const newBody = { ...body };
    newBody["__lib"] = "mission";
    newBody["__act"] = "get_default";
    newBody["get_success_repeat"] = "1";
    newBody["no_compatible_fix"] = "1";
    const options = {
      url: "https://ngabbs.com/nuke.php",
      headers: {
        "Content-Type": contentType,
        Cookie: cookie,
        "User-Agent": userAgent,
      },
      body: ObjectToFormData(newBody, contentType),
    };

     $httpClient.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(err, resp);
        } else {
          const result = JSON.parse(data);
          const mids = result.data[0].map((d) => d.id);
          resolve(mids);
        }
      } catch (e) {
        console.log(e, resp);
        resolve([]);
      }
    });
  });
  return promise;
}

function checkInCountAdd(mid) {
  const promise = new Promise((resolve) => {
    const newBody = { ...body };
    newBody["__lib"] = "mission";
    newBody["__act"] = "checkin_count_add";
    newBody["no_compatible_fix"] = "1";
    newBody["mid"] = mid;
    const options = {
      url: "https://ngabbs.com/nuke.php",
      headers: {
        "Content-Type": contentType,
        Cookie: cookie,
        "User-Agent": userAgent,
      },
      body: ObjectToFormData(newBody, contentType),
    };

    $httpClient.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(err, resp);
        } else {
          console.log(`mission:${mid}`);
        }
      } catch (e) {
        console.log(e, resp);
      } finally {
        resolve();
      }
    });
  });
  return promise;
}

function ObjectToFormData(object, contentType) {
  const boundary = contentType.split("; ")[1].split("=")[1];
  const splitBoundary = `--${boundary}`;
  var body = `${splitBoundary}\r\n`;
  const array = [];
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      array.push({
        name: key,
        value: object[key],
      });
    }
  }
  var data = array.map((element) => {
    var name = `Content-Disposition: form-data; name="${element.name}"`;
    var entityString = `${name}\r\n\r\n${element.value}`;
    return entityString;
  });
  body = `${body}${data.join(
    `\r\n${splitBoundary}\r\n`
  )}\r\n${splitBoundary}--\r\n`;
  return body;
}

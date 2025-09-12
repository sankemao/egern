!(async () => {
  if ($request.body && $request.body.includes("------WebKitForm")) {
    const cookie = $request.headers["cookie"];
    const contentType = $request.headers["content-type"];
    const userAgent = $request.headers["user-agent"];
    const body = $request.body;
    var obj = FormDataToObject(body, contentType);
    if (obj["__lib"] === "mission" && obj["__act"] === "get_default") {
      var obj = FormDataToObject(body, contentType);
      $persistentStore.write(
        JSON.stringify({
          userAgent,
          contentType,
          cookie,
          body: obj,
        }),
        "NGA"
      );
      $notification.post("NGA COOKIE", "获取成功");
    }
  }
})()
  .catch((e) => console.log("解析cookie错误" + e.toString()))
  .finally(() => $done({}));

function FormDataToObject(form, contentType) {
  const boundary = contentType.split("; ")[1].split("=")[1];
  const splitBoundary = `--${boundary}`;
  const index = form.indexOf(splitBoundary);
  form = form.substr(index);
  const lastIndex = form.lastIndexOf(splitBoundary);
  form = form.substring(0, lastIndex);
  const array = compact(form.split(splitBoundary)).map((a) => {
    const entity = compact(a.split("\r\n"));
    const regex = /Content-Disposition: form-data; name="(.*)"/;
    var matchs = regex.exec(entity[0]);
    return {
      name: matchs[1],
      value: entity[1],
    };
  });

  function compact(array) {
    let resIndex = 0;
    const result = [];
    if (array == null) {
      return result;
    }
    for (const value of array) {
      if (value) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  const result = {};
  array.forEach((a) => {
    result[a.name] = a.value;
  });
  return result;
}

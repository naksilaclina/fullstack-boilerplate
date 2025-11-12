import path from "path";
import modulesAlias from "module-alias";

modulesAlias.addAliases({
  "~api-root": path.resolve(__dirname, "../src"),
  "~api": path.resolve(__dirname, "../src/api"),
  "~config": path.resolve(__dirname, "../src/config"),
});
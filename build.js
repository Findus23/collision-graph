const esbuild = require('esbuild')

switch (process.argv[2]) {
    case "build":
        esbuild.build({
            entryPoints: ["src/index.js"],
            target: "es2020",
            bundle: true,
            sourcemap: true,
            minify: true,
            color: true,
            outdir: "public",
        })
        break
    case "serve":
        esbuild.serve({
            port: 1234,
            servedir: "public"
        }, {
            entryPoints: ['src/index.js'],
            bundle: true,
            target: "es2020",
            outdir: 'public',
            sourcemap: true,
            format: "esm", splitting: true
            // minify:true
        }).catch(() => process.exit(1))
        break
    default:
        console.log(process.argv)
}



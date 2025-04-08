import esbuild from "esbuild";
import { lessLoader } from 'esbuild-plugin-less';
import process from "process";
import builtins from "builtin-modules";
import fs from "fs";

/** 读取 package.json 和 manifest.json */
const pkg = JSON.parse(fs.readFileSync('./package.json', { encoding:'utf8', flag:'r' }));
const manifest = JSON.parse(fs.readFileSync('./manifest.json', { encoding:'utf8', flag:'r' }));

/** 生成 banner */
const banner =
`/**
 * @name: ${manifest.name}
 * @author: ${pkg.author}
 * @description: ${pkg.description}
 * @created: 2024-11-26 09:28:10
 * @updated: ${new Date().toLocaleString().replace(/\//g, "-")}
 * @version: ${pkg.version}
 */
`;

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
	banner: {
		js: banner,
	},
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "dist/main.js",
	minify: prod,
	plugins: [
        lessLoader(
			{},  // Less 编译选项（可选）
			{
			  filter: /\.less$/,  // 匹配所有 .less 文件
			  inline: true         // 关键：将样式内联为字符串
			}
		)
    ],
});

/** 同步到 Obsidian 中 */
const sync = () => {
	const target = 'F:/Obsidian/.obsidian/plugins/obsidian-ji'
	const fileList = [
		'dist/main.js',
		'dist/styles.css',
		'manifest.json',
	]
  /** 如果目标文件夹不存在 */
  if (!fs.existsSync(target)) {
    console.log('同步目标文件夹不存在')
    return
  }
	fileList.forEach(file => {
		if(!fs.existsSync(file)) {
			console.log(`文件不存在：${file}`)
			return
		}
		/** 将文件复制到目标文件夹下同名文件 */
		fs.copyFileSync(file, `${target}/${file.replace(/^.*\//, '')}`);
		console.log(`同步文件：${file}`)
	})
}

if (prod) {
	await context.rebuild();
	sync();
	process.exit(0);
} else {
	await context.watch();
	sync();
}

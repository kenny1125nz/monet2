#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";

const program = new Command();

program
    .name("monet2")
    .description("A CLI application for monet2")
    .version(version);

program.parse(process.argv);

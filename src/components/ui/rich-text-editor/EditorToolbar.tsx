import * as React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link, Unlink, Quote, Minus, Code, RemoveFormatting, Undo, Redo,
  Palette, Image, ChevronDown, Eye, Code2,
  Superscript, Subscript, Indent, Outdent, Highlighter, Maximize, Minimize,
  Type, LineChart, Search, Printer, ArrowRightLeft, Video, Upload, CheckSquare,
} from "lucide-react";
import { ToolBtn, Divider, ToolGroup } from "./ToolBtn";
import { TablePicker } from "./TablePicker";
import { EmojiPicker } from "./EmojiPicker";
import { SpecialCharsPicker } from "./SpecialCharsPicker";
import { PRESET_COLORS, HIGHLIGHT_COLORS, FONT_SIZES, FONT_FAMILIES, LINE_HEIGHTS } from "./constants";

interface EditorToolbarProps {
  toolbar: "full" | "minimal";
  disabled: boolean;
  readOnly: boolean;
  activeFormats: Set<string>;
  showSource: boolean;
  isFullscreen: boolean;
  execCommand: (command: string, value?: string) => void;
  onToggleSource: () => void;
  onToggleFullscreen: () => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertEmoji: (emoji: string) => void;
  onInsertLink: (url: string) => void;
  onInsertImage: (url: string) => void;
  onInsertChar: (char: string) => void;
  onInsertVideo: (url: string) => void;
  onInsertChecklist: () => void;
  onSetLineHeight: (value: string) => void;
  onToggleFindReplace: () => void;
  onToggleDirection: () => void;
  onPrint: () => void;
  onSaveSelection: () => void;
}

export const EditorToolbar = ({
  toolbar, disabled, readOnly, activeFormats, showSource, isFullscreen,
  execCommand, onToggleSource, onToggleFullscreen,
  onInsertTable, onInsertEmoji, onInsertLink, onInsertImage,
  onInsertChar, onInsertVideo, onInsertChecklist, onSetLineHeight,
  onToggleFindReplace, onToggleDirection, onPrint, onSaveSelection,
}: EditorToolbarProps) => {
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [imageOpen, setImageOpen] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState("");
  const [videoOpen, setVideoOpen] = React.useState(false);
  const imageFileRef = React.useRef<HTMLInputElement>(null);
  const videoFileRef = React.useRef<HTMLInputElement>(null);

  const isDisabled = disabled || readOnly;
  const isActive = (cmd: string) => activeFormats.has(cmd);
  const isBlockActive = (tag: string) => activeFormats.has(`formatBlock:${tag}`);
  const currentHeading = isBlockActive("h1") ? "H1" : isBlockActive("h2") ? "H2" : isBlockActive("h3") ? "H3" : isBlockActive("h4") ? "H4" : isBlockActive("h5") ? "H5" : isBlockActive("h6") ? "H6" : "¶";

  const handleInsertLink = () => {
    if (linkUrl) { onInsertLink(linkUrl); setLinkUrl(""); setLinkOpen(false); }
  };
  const handleInsertImage = () => {
    if (imageUrl) { onInsertImage(imageUrl); setImageUrl(""); setImageOpen(false); }
  };
  const handleInsertVideo = () => {
    if (videoUrl) { onInsertVideo(videoUrl); setVideoUrl(""); setVideoOpen(false); }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onInsertImage(reader.result);
        setImageOpen(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const html = `<video controls style="max-width:100%;border-radius:8px;" src="${reader.result}"></video>`;
        document.execCommand("insertHTML", false, html);
        setVideoOpen(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const dropdownBtnClass = "h-7 px-2 flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 disabled:opacity-40";
  const utilBtnClass = "h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 disabled:opacity-40";

  return (
    <div className="border-b border-input bg-muted/20">
      {/* Row 1: History, Headings, Font controls */}
      <div className="flex flex-wrap items-center gap-1 px-1.5 py-1">
        {/* History */}
        <ToolGroup label="History">
          <ToolBtn icon={Undo} command="undo" label="Undo (Ctrl+Z)" disabled={isDisabled} execCommand={execCommand} />
          <ToolBtn icon={Redo} command="redo" label="Redo (Ctrl+Y)" disabled={isDisabled} execCommand={execCommand} />
        </ToolGroup>

        <Divider />

        {/* Block format */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" disabled={isDisabled} className={dropdownBtnClass}>
              {currentHeading}<ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            <DropdownMenuItem onSelect={() => execCommand("formatBlock", "p")}><span className="text-sm">Paragraph</span></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => execCommand("formatBlock", "h1")}><span className="text-xl font-bold">Heading 1</span></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => execCommand("formatBlock", "h2")}><span className="text-lg font-bold">Heading 2</span></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => execCommand("formatBlock", "h3")}><span className="text-base font-bold">Heading 3</span></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => execCommand("formatBlock", "h4")}><span className="text-sm font-bold">Heading 4</span></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => execCommand("formatBlock", "h5")}><span className="text-xs font-bold">Heading 5</span></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => execCommand("formatBlock", "h6")}><span className="text-xs font-semibold text-muted-foreground">Heading 6</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {toolbar === "full" && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" disabled={isDisabled} className={dropdownBtnClass}>
                  <Type className="h-3 w-3" />Font<ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[160px]">
                {FONT_FAMILIES.map((f) => (
                  <DropdownMenuItem key={f.value} onSelect={() => execCommand("fontName", f.value)}>
                    <span className="text-sm" style={{ fontFamily: f.value }}>{f.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" disabled={isDisabled} className={dropdownBtnClass}>
                  Size<ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[100px]">
                {FONT_SIZES.map((s) => (
                  <DropdownMenuItem key={s.value} onSelect={() => execCommand("fontSize", s.value)}>
                    <span className="text-sm">{s.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" disabled={isDisabled} className={dropdownBtnClass}>
                  <LineChart className="h-3 w-3" />LH<ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[80px]">
                {LINE_HEIGHTS.map((lh) => (
                  <DropdownMenuItem key={lh.value} onSelect={() => onSetLineHeight(lh.value)}>
                    <span className="text-sm">{lh.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <Divider />

        {/* Text Formatting */}
        <ToolGroup label="Format">
          <ToolBtn icon={Bold} command="bold" label="Bold (Ctrl+B)" active={isActive("bold")} disabled={isDisabled} execCommand={execCommand} />
          <ToolBtn icon={Italic} command="italic" label="Italic (Ctrl+I)" active={isActive("italic")} disabled={isDisabled} execCommand={execCommand} />
          <ToolBtn icon={Underline} command="underline" label="Underline (Ctrl+U)" active={isActive("underline")} disabled={isDisabled} execCommand={execCommand} />
          <ToolBtn icon={Strikethrough} command="strikeThrough" label="Strikethrough" active={isActive("strikeThrough")} disabled={isDisabled} execCommand={execCommand} />
          {toolbar === "full" && (
            <>
              <ToolBtn icon={Superscript} command="superscript" label="Superscript" active={isActive("superscript")} disabled={isDisabled} execCommand={execCommand} />
              <ToolBtn icon={Subscript} command="subscript" label="Subscript" active={isActive("subscript")} disabled={isDisabled} execCommand={execCommand} />
            </>
          )}
        </ToolGroup>

        {toolbar === "full" && (
          <>
            <Divider />
            {/* Colors */}
            <ToolGroup label="Colors">
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" disabled={isDisabled} className={utilBtnClass}>
                    <Palette className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="text-xs font-medium text-foreground mb-1.5">Text Color</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_COLORS.map((color) => (
                      <button key={color} type="button" className="h-6 w-6 rounded-md border border-input hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: color }} onMouseDown={(e) => { e.preventDefault(); execCommand("foreColor", color); }} />
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-border">
                    <input type="color" className="h-6 w-6 cursor-pointer border-0 p-0 rounded" onChange={(e) => execCommand("foreColor", e.target.value)} />
                    <span className="text-[10px] text-muted-foreground">Custom color</span>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" disabled={isDisabled} className={utilBtnClass}>
                    <Highlighter className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="text-xs font-medium text-foreground mb-1.5">Highlight Color</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button key={color} type="button" className="h-6 w-6 rounded-md border border-input hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: color }} onMouseDown={(e) => { e.preventDefault(); execCommand("hiliteColor", color); }} />
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-border">
                    <input type="color" className="h-6 w-6 cursor-pointer border-0 p-0 rounded" onChange={(e) => execCommand("hiliteColor", e.target.value)} />
                    <span className="text-[10px] text-muted-foreground">Custom color</span>
                  </div>
                </PopoverContent>
              </Popover>
            </ToolGroup>
          </>
        )}
      </div>

      {/* Row 2: Alignment, Lists, Links, Media, Utilities */}
      <div className="flex flex-wrap items-center gap-1 px-1.5 py-1 border-t border-border/40">
        {/* Alignment */}
        <ToolGroup label="Alignment">
          <ToolBtn icon={AlignLeft} command="justifyLeft" label="Align Left" active={isActive("justifyLeft")} disabled={isDisabled} execCommand={execCommand} />
          <ToolBtn icon={AlignCenter} command="justifyCenter" label="Align Center" active={isActive("justifyCenter")} disabled={isDisabled} execCommand={execCommand} />
          <ToolBtn icon={AlignRight} command="justifyRight" label="Align Right" active={isActive("justifyRight")} disabled={isDisabled} execCommand={execCommand} />
          {toolbar === "full" && (
            <ToolBtn icon={AlignJustify} command="justifyFull" label="Justify" active={isActive("justifyFull")} disabled={isDisabled} execCommand={execCommand} />
          )}
        </ToolGroup>

        <Divider />

        {/* Lists */}
        <ToolGroup label="Lists">
          <ToolBtn icon={List} command="insertUnorderedList" label="Bullet List" active={isActive("insertUnorderedList")} disabled={isDisabled} execCommand={execCommand} />
          <ToolBtn icon={ListOrdered} command="insertOrderedList" label="Numbered List" active={isActive("insertOrderedList")} disabled={isDisabled} execCommand={execCommand} />
          <button type="button" disabled={isDisabled} onMouseDown={(e) => { e.preventDefault(); onInsertChecklist(); }} className={utilBtnClass} title="Checklist">
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
          <ToolBtn icon={Quote} command="formatBlock" value="blockquote" label="Blockquote" active={isBlockActive("blockquote")} disabled={isDisabled} execCommand={execCommand} />
          {toolbar === "full" && (
            <>
              <ToolBtn icon={Indent} command="indent" label="Indent" disabled={isDisabled} execCommand={execCommand} />
              <ToolBtn icon={Outdent} command="outdent" label="Outdent" disabled={isDisabled} execCommand={execCommand} />
            </>
          )}
        </ToolGroup>

        <Divider />

        {/* Link */}
        <Popover open={linkOpen} onOpenChange={(open) => { if (open) onSaveSelection(); setLinkOpen(open); }}>
          <PopoverTrigger asChild>
            <button type="button" disabled={isDisabled} className={utilBtnClass}>
              <Link className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 space-y-2" align="start">
            <div className="text-xs font-medium text-foreground mb-1">Insert Link</div>
            <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInsertLink()} className="h-8 text-xs" />
            <Button size="sm" className="w-full h-7 text-xs" onClick={handleInsertLink}>Insert Link</Button>
          </PopoverContent>
        </Popover>
        <ToolBtn icon={Unlink} command="unlink" label="Remove Link" disabled={isDisabled} execCommand={execCommand} />

        {toolbar === "full" && (
          <>
            <Divider />

            {/* Media */}
            <ToolGroup label="Media">
              <Popover open={imageOpen} onOpenChange={(open) => { if (open) onSaveSelection(); setImageOpen(open); }}>
                <PopoverTrigger asChild>
                  <button type="button" disabled={isDisabled} className={utilBtnClass}>
                    <Image className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="w-full h-8 mb-2">
                      <TabsTrigger value="upload" className="text-xs h-7 flex-1"><Upload className="h-3 w-3 mr-1" />Upload</TabsTrigger>
                      <TabsTrigger value="url" className="text-xs h-7 flex-1"><Link className="h-3 w-3 mr-1" />URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-0 space-y-2">
                      <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => imageFileRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />Choose Image File
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">JPG, PNG, GIF, WebP</p>
                    </TabsContent>
                    <TabsContent value="url" className="mt-0 space-y-2">
                      <Input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInsertImage()} className="h-8 text-xs" />
                      <Button size="sm" className="w-full h-7 text-xs" onClick={handleInsertImage}>Insert Image</Button>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>

              <Popover open={videoOpen} onOpenChange={(open) => { if (open) onSaveSelection(); setVideoOpen(open); }}>
                <PopoverTrigger asChild>
                  <button type="button" disabled={isDisabled} className={utilBtnClass}>
                    <Video className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="w-full h-8 mb-2">
                      <TabsTrigger value="url" className="text-xs h-7 flex-1"><Video className="h-3 w-3 mr-1" />YouTube/URL</TabsTrigger>
                      <TabsTrigger value="upload" className="text-xs h-7 flex-1"><Upload className="h-3 w-3 mr-1" />Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="mt-0 space-y-2">
                      <Input placeholder="YouTube or video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInsertVideo()} className="h-8 text-xs" />
                      <Button size="sm" className="w-full h-7 text-xs" onClick={handleInsertVideo}>Embed Video</Button>
                    </TabsContent>
                    <TabsContent value="upload" className="mt-0 space-y-2">
                      <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => videoFileRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />Choose Video File
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">MP4, WebM, OGG</p>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>

              <TablePicker disabled={isDisabled} onInsertTable={onInsertTable} />
            </ToolGroup>

            <Divider />

            {/* Extras */}
            <ToolGroup label="Insert">
              <EmojiPicker disabled={isDisabled} onInsertEmoji={onInsertEmoji} />
              <SpecialCharsPicker disabled={isDisabled} onInsertChar={onInsertChar} />
              <ToolBtn icon={Minus} command="insertHorizontalRule" label="Horizontal Rule" disabled={isDisabled} execCommand={execCommand} />
              <ToolBtn icon={Code} command="formatBlock" value="pre" label="Code Block" active={isBlockActive("pre")} disabled={isDisabled} execCommand={execCommand} />
            </ToolGroup>

            <Divider />

            {/* Clear & Utilities */}
            <ToolBtn icon={RemoveFormatting} command="removeFormat" label="Clear Formatting" disabled={isDisabled} execCommand={execCommand} />

            <Divider />

            <ToolGroup label="Tools">
              <button type="button" disabled={isDisabled} onMouseDown={(e) => { e.preventDefault(); onToggleDirection(); }} className={utilBtnClass} title="Toggle Direction">
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); onToggleFindReplace(); }} className={utilBtnClass} title="Find & Replace">
                <Search className="h-3.5 w-3.5" />
              </button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); onPrint(); }} className={utilBtnClass} title="Print">
                <Printer className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onToggleFullscreen(); }}
                className={cn(utilBtnClass, isFullscreen && "bg-primary/10 text-primary")}
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onToggleSource(); }}
                className={cn(utilBtnClass, showSource && "bg-primary/10 text-primary")}
                title="View Source"
              >
                {showSource ? <Eye className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
              </button>
            </ToolGroup>
          </>
        )}

        {toolbar === "minimal" && (
          <>
            <Divider />
            <ToolBtn icon={RemoveFormatting} command="removeFormat" label="Clear Formatting" disabled={isDisabled} execCommand={execCommand} />
          </>
        )}
      </div>
    </div>
  );
};

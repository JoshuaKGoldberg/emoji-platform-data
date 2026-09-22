/*
 * Dumps the raw emoji metadata macOS's emoji picker uses, as JSON on stdout.
 *
 * macOS keeps its emoji keywords in a search index under CoreEmoji.framework.
 * That index is keyed by an internal document ID rather than by emoji, and
 * nothing on disk maps those IDs back to emoji. EmojiFoundation.framework,
 * which is what the picker itself uses, exposes both halves: each
 * EMFEmojiToken knows its document ID, and EMFInvertedIndex reads the index.
 *
 * Neither framework is public API, so everything here goes through the
 * Objective-C runtime. See scripts/refreshMacOS.ts, which compiles and runs
 * this, then reshapes its output into packages/generator/macos.json.
 */

#import <Foundation/Foundation.h>
#import <dlfcn.h>
#import <objc/message.h>
#import <objc/runtime.h>

static const char *EmojiFoundationPath =
    "/System/Library/PrivateFrameworks/EmojiFoundation.framework/EmojiFoundation";

static id send(id target, const char *selector) {
  return ((id (*)(id, SEL))objc_msgSend)(target, sel_getUid(selector));
}

static id sendWithObject(id target, const char *selector, id argument) {
  return ((id (*)(id, SEL, id))objc_msgSend)(target, sel_getUid(selector),
                                             argument);
}

static id sendWithLong(id target, const char *selector, long argument) {
  return ((id (*)(id, SEL, long))objc_msgSend)(target, sel_getUid(selector),
                                               argument);
}

static id sendWithLongs(id target, const char *selector, long first,
                        long second) {
  return ((id (*)(id, SEL, long, long))objc_msgSend)(
      target, sel_getUid(selector), first, second);
}

static BOOL sendForBool(id target, const char *selector) {
  return ((BOOL (*)(id, SEL))objc_msgSend)(target, sel_getUid(selector));
}

static unsigned short sendForUnsignedShort(id target, const char *selector) {
  return ((unsigned short (*)(id, SEL))objc_msgSend)(target,
                                                     sel_getUid(selector));
}

/* EMFEmojiToken's nameForType: values, as used by the picker and VoiceOver. */
typedef NS_ENUM(long, EmojiNameType) {
  EmojiNameTypeUnicode = 0,
  EmojiNameTypeApple = 1,
  EmojiNameTypeVoiceOver = 3,
  EmojiNameTypeSpeech = 4,
};

static id nameOfType(id token, EmojiNameType type) {
  return sendWithLong(token, "nameForType:", (long)type) ?: [NSNull null];
}

int main(int argc, char *argv[]) {
  @autoreleasepool {
    if (!dlopen(EmojiFoundationPath, RTLD_NOW)) {
      fprintf(stderr, "Could not load EmojiFoundation: %s\n", dlerror());
      return 1;
    }

    Class categoryClass = objc_getClass("EMFEmojiCategory");
    Class indexLoaderClass = objc_getClass("EMFIndexLoader");
    Class localeDataClass = objc_getClass("EMFEmojiLocaleData");
    Class bundleLoaderClass = objc_getClass("EMFSearchEngineBundleLoader");

    if (!categoryClass || !indexLoaderClass || !localeDataClass ||
        !bundleLoaderClass) {
      fprintf(stderr,
              "EmojiFoundation loaded but is missing an expected class. This "
              "version of macOS likely reorganized it.\n");
      return 1;
    }

    NSString *localeIdentifier = argc > 1 ? @(argv[1]) : @"en_US";
    NSLocale *locale = [NSLocale localeWithLocaleIdentifier:localeIdentifier];
    id localeData = sendWithObject(
        localeDataClass, "emojiLocaleDataWithLocaleIdentifier:",
        localeIdentifier);
    NSBundle *bundle =
        sendWithObject(bundleLoaderClass, "assetBundleForLocale:", locale);

    if (!bundle) {
      fprintf(stderr, "No emoji search index bundle for locale %s.\n",
              localeIdentifier.UTF8String);
      return 1;
    }

    id index = sendWithObject(indexLoaderClass, "defaultIndexForBundle:",
                              bundle);

    /*
     * Category membership doubles as the picker's display order: categories
     * come back in the order the picker shows them, as do the emoji within
     * each. Recents is skipped because it holds whatever this Mac has used.
     */
    NSMutableDictionary<NSString *, NSString *> *categories =
        [NSMutableDictionary dictionary];
    NSMutableDictionary<NSString *, NSNumber *> *orders =
        [NSMutableDictionary dictionary];
    NSInteger order = 0;

    for (NSString *identifier in send(categoryClass,
                                      "categoryIdentifierList")) {
      if ([identifier isEqualToString:@"EMFEmojiCategoryRecents"]) {
        continue;
      }

      id category =
          sendWithObject(categoryClass, "categoryWithIdentifier:", identifier);
      NSString *name =
          [identifier stringByReplacingOccurrencesOfString:@"EMFEmojiCategory"
                                                withString:@""];

      for (id token in sendWithObject(category, "emojiTokensForLocaleData:",
                                      localeData)) {
        NSString *string = send(token, "string");
        if (categories[string]) {
          continue;
        }

        categories[string] = name;
        orders[string] = @(order++);
      }
    }

    NSMutableArray<NSDictionary *> *entries = [NSMutableArray array];

    for (id token in sendWithLongs(
             localeData, "emojiTokensForOptions:presentationStyle:", 0, 0)) {
      NSString *string = send(token, "string");
      unsigned short document = sendForUnsignedShort(token, "_emojiIndex");
      NSDictionary<NSString *, NSDictionary *> *terms =
          sendWithObject(index, "termsForDocument:", @(document));
      NSMutableDictionary<NSString *, NSNumber *> *keywordWeights =
          [NSMutableDictionary dictionary];

      [terms enumerateKeysAndObjectsUsingBlock:^(
                 NSString *term, NSDictionary *posting, BOOL *stop) {
        keywordWeights[term] = posting[@"w"] ?: @0;
      }];

      [entries addObject:@{
        @"appleName" : nameOfType(token, EmojiNameTypeApple),
        @"category" : categories[string] ?: [NSNull null],
        @"emoji" : string,
        @"isCommon" : @(sendForBool(token, "isCommon")),
        @"keywordWeights" : keywordWeights,
        @"order" : orders[string] ?: [NSNull null],
        @"speechName" : nameOfType(token, EmojiNameTypeSpeech),
        @"unicodeName" : nameOfType(token, EmojiNameTypeUnicode),
        @"voiceOverName" : nameOfType(token, EmojiNameTypeVoiceOver),
      }];
    }

    NSError *error = nil;
    NSData *json = [NSJSONSerialization dataWithJSONObject:entries
                                                   options:0
                                                     error:&error];

    if (!json) {
      fprintf(stderr, "Could not serialize emoji data: %s\n",
              error.localizedDescription.UTF8String);
      return 1;
    }

    fwrite(json.bytes, 1, json.length, stdout);
    fprintf(stderr, "Extracted %lu emoji tokens for %s.\n",
            (unsigned long)entries.count, localeIdentifier.UTF8String);
  }

  return 0;
}

/*
Copyright (c) 2012 Stencila Ltd

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is 
hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD 
TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. 
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR 
CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA
OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, 
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

//! Used when all test suites are compiled into a single executable

#define BOOST_TEST_MODULE tests
#include <boost/test/unit_test.hpp>
#include <boost/filesystem.hpp>

//! @brief Global fixture for one off setup and teardown at start and end of testing
struct GlobalFixture {
    GlobalFixture(void){
        boost::filesystem::create_directories("outputs");
    }
};
BOOST_GLOBAL_FIXTURE(GlobalFixture);

#include "traits.cpp"
#include "print.cpp"
#include "reflect.cpp"

#include "json.cpp"
#include "xml.cpp"
#include "compress.cpp"

#include "component.cpp"
#include "dataset.cpp"
#include "datatable.cpp"
#include "dataquery.cpp"
#include "stencil.cpp"
#include "theme.cpp"
